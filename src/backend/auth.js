import { Router } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { pool } from "./db.js";

const router = Router();
const COOKIE = "styleai_session";
const DAY = 24 * 60 * 60 * 1000;

// scrypt is slow on purpose, so guessing passwords takes forever.
// Saved as "salt:hash", a new random salt for every password.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function checkPassword(password, saved) {
  const [salt, hash] = saved.split(":");
  if (!salt || !hash) return false;
  const attempt = crypto.scryptSync(password, salt, 64);
  // Compares in the same time whether it's right or wrong, so timing gives nothing away
  return crypto.timingSafeEqual(attempt, Buffer.from(hash, "hex"));
}

// Only the hash of the token is stored, see schema.sql
function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function readCookie(req, name) {
  const pair = (req.headers.cookie ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(name + "="));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
}

// Remember me: 30 days, survives closing the browser. Otherwise 1 day, gone when it closes.
async function startSession(res, userId, remember) {
  const token = crypto.randomBytes(32).toString("base64url");
  const days = remember ? 30 : 1;
  await pool.query(
    `insert into sessions (token_hash, user_id, expires_at)
     values ($1, $2, now() + make_interval(days => $3))`,
    [sha256(token), userId, days],
  );
  res.cookie(COOKIE, token, {
    httpOnly: true, // page scripts can't read it
    sameSite: "lax", // not sent along with requests from other sites
    secure: process.env.NODE_ENV === "production", // https only once it's live
    path: "/",
    ...(remember ? { maxAge: days * DAY } : {}),
  });
}

// Lets a request through only with a valid session. Sets req.userId for the routes after it.
export async function requireUser(req, res, next) {
  try {
    const token = readCookie(req, COOKIE);
    if (token) {
      const { rows } = await pool.query(
        "select user_id from sessions where token_hash = $1 and expires_at > now()",
        [sha256(token)],
      );
      if (rows.length) {
        req.userId = rows[0].user_id;
        return next();
      }
    }
    res.status(401).json({ message: "Please log in" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not check the login" });
  }
}

function looksLikeEmail(email) {
  return typeof email === "string" && /^\S+@\S+\.\S+$/.test(email);
}

router.post("/auth/signup", async (req, res) => {
  const { name, password } = req.body;
  const email = String(req.body.email ?? "")
    .trim()
    .toLowerCase();

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Enter your name" });
  }
  if (!looksLikeEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password needs at least 8 characters" });
  }

  try {
    const found = await pool.query(
      "select id, password_hash from users where email = $1",
      [email],
    );
    let userId;

    if (found.rows.length && found.rows[0].password_hash) {
      return res
        .status(400)
        .json({ message: "That email already has an account" });
    }
    if (found.rows.length) {
      // The account from before logins existed: whoever signs up with its email gets it
      userId = found.rows[0].id;
      await pool.query(
        "update users set name = $1, password_hash = $2 where id = $3",
        [name.trim(), hashPassword(password), userId],
      );
    } else {
      const made = await pool.query(
        `insert into users (email, password_hash, name) values ($1, $2, $3) returning id`,
        [email, hashPassword(password), name.trim()],
      );
      userId = made.rows[0].id;
      await pool.query("insert into preferences (user_id) values ($1)", [
        userId,
      ]);
    }

    await startSession(res, userId, true);
    res.status(201).json({ message: "Welcome to StyleAI" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not create the account" });
  }
});

router.post("/auth/login", async (req, res) => {
  const { password, remember } = req.body;
  const email = String(req.body.email ?? "")
    .trim()
    .toLowerCase();

  if (!looksLikeEmail(email) || typeof password !== "string") {
    return res.status(400).json({ message: "Enter your email and password" });
  }

  try {
    const { rows } = await pool.query(
      "select id, password_hash from users where email = $1",
      [email],
    );
    // Same answer for an unknown email and a wrong password,
    // so nobody can find out which emails have accounts
    if (!rows.length || !checkPassword(password, rows[0].password_hash)) {
      return res.status(401).json({ message: "Wrong email or password" });
    }

    // A good moment to clear out old sessions
    await pool.query("delete from sessions where expires_at < now()");
    await startSession(res, rows[0].id, Boolean(remember));
    res.json({ message: "Welcome back" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not log in" });
  }
});

router.post("/auth/logout", async (req, res) => {
  try {
    const token = readCookie(req, COOKIE);
    if (token) {
      await pool.query("delete from sessions where token_hash = $1", [
        sha256(token),
      ]);
    }
    res.clearCookie(COOKIE, { path: "/" });
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not log out" });
  }
});

// Deletes the account and everything in it. The database removes the
// items, outfits, preferences and sessions with it (on delete cascade).
router.delete("/auth/account", requireUser, async (req, res) => {
  try {
    const items = await pool.query(
      "select image from items where user_id = $1",
      [req.userId],
    );
    const user = await pool.query(
      "delete from users where id = $1 returning photo",
      [req.userId],
    );

    // The photos are files, not rows, so they go by hand
    const photos = [user.rows[0]?.photo, ...items.rows.map((row) => row.image)];
    for (const photo of photos.filter(Boolean)) {
      fs.rm(
        path.join("uploads", path.basename(photo)),
        { force: true },
        () => {},
      );
    }

    res.clearCookie(COOKIE, { path: "/" });
    res.json({ message: "Account deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete the account" });
  }
});

export default router;
