import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { pool } from "./db.js";
import { sendMail } from "./mail.js";

const router = Router();
const COOKIE = "styleai_session";
const DAY = 24 * 60 * 60 * 1000;

// bcrypt is slow on purpose, so guessing passwords takes forever.
// 12 rounds is about a quarter of a second per try. The salt is saved inside
// the hash itself ("$2b$12$..."), a new one for every password.
const ROUNDS = 12;

function makeHash(password) {
  return bcrypt.hash(password, ROUNDS);
}

// bcrypt.compare takes the same time whether the password is right or wrong
async function checkPassword(password, saved) {
  if (!saved) return false; // an account from before logins has no password yet
  return bcrypt.compare(password, saved);
}

// Checked against when the email doesn't exist, so the answer takes as long
// as a real check and the timing doesn't tell which emails have accounts
const NOBODY = bcrypt.hashSync("nobody has this password", ROUNDS);

// bcrypt only looks at the first 72 bytes and quietly drops the rest,
// so a longer password is refused instead of being cut short
function passwordProblem(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password needs at least 8 characters";
  }
  if (Buffer.byteLength(password) > 72) {
    return "Password can be at most 72 characters";
  }
  return null;
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

// Slows down password guessing. Kept in memory: a restart forgets it, which is fine.
// key -> times of recent tries
const TRY_WINDOW = 15 * 60 * 1000;
const tries = new Map();

// Counts one more try. True when the key is over its limit for the last 15 minutes.
function tooMany(key, limit) {
  const now = Date.now();
  const recent = (tries.get(key) ?? []).filter((at) => now - at < TRY_WINDOW);
  recent.push(now);
  tries.set(key, recent);
  return recent.length > limit;
}

// Forget old tries now and then, so the map doesn't keep growing
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of tries) {
    if (times.every((at) => now - at >= TRY_WINDOW)) tries.delete(key);
  }
}, TRY_WINDOW);

function slowDown(res) {
  return res
    .status(429)
    .json({ message: "Too many tries. Wait 15 minutes and try again." });
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
  const problem = passwordProblem(password);
  if (problem) return res.status(400).json({ message: problem });
  // A handful of new accounts per address is plenty
  if (tooMany(`signup:${req.ip}`, 10)) return slowDown(res);

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
        [name.trim(), await makeHash(password), userId],
      );
    } else {
      const made = await pool.query(
        `insert into users (email, password_hash, name) values ($1, $2, $3) returning id`,
        [email, await makeHash(password), name.trim()],
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
  // Many tries from one address (any email), or wrong passwords for one email
  if (tooMany(`login:${req.ip}`, 100)) return slowDown(res);
  const failed = tries.get(`wrong:${email}`) ?? [];
  if (failed.filter((at) => Date.now() - at < TRY_WINDOW).length >= 5) {
    return slowDown(res);
  }

  try {
    const { rows } = await pool.query(
      "select id, password_hash from users where email = $1",
      [email],
    );
    // Same answer for an unknown email and a wrong password,
    // so nobody can find out which emails have accounts
    // Unknown email: still check against NOBODY, so it takes just as long
    const right = await checkPassword(
      password,
      rows.length ? rows[0].password_hash : NOBODY,
    );
    if (!rows.length || !right) {
      tooMany(`wrong:${email}`, 5);
      return res.status(401).json({ message: "Wrong email or password" });
    }
    // Got it right: start counting from zero again
    tries.delete(`wrong:${email}`);

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

// Forgot password, step 1: email a link that works once, for one hour.
// The answer is the same whether the email has an account or not,
// so this form can't be used to find out who has one.
router.post("/auth/forgot", async (req, res) => {
  const email = String(req.body.email ?? "")
    .trim()
    .toLowerCase();
  const answer = {
    message:
      "If that email has an account, we sent a link to reset the password.",
  };

  if (!looksLikeEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email" });
  }
  // Don't let anyone flood someone's inbox
  if (tooMany(`forgot:${req.ip}`, 10) || tooMany(`forgot:${email}`, 3)) {
    return slowDown(res);
  }

  try {
    const { rows } = await pool.query(
      "select id, name from users where email = $1",
      [email],
    );
    if (!rows.length) return res.json(answer);

    // Only the newest link works
    const token = crypto.randomBytes(32).toString("base64url");
    await pool.query("delete from password_resets where user_id = $1", [
      rows[0].id,
    ]);
    await pool.query(
      `insert into password_resets (token_hash, user_id, expires_at)
       values ($1, $2, now() + interval '1 hour')`,
      [sha256(token), rows[0].id],
    );

    const appUrl = process.env.APP_URL || "http://127.0.0.1:5173";
    await sendMail({
      to: email,
      subject: "Reset your StyleAI password",
      text: `Hi ${rows[0].name},\n\nOpen this link to pick a new password. It works once, for one hour:\n${appUrl}/reset-password?token=${token}\n\nDidn't ask for this? Just ignore this email, nothing changes.\n\nStella from StyleAI`,
    });
    res.json(answer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not send the email" });
  }
});

// Forgot password, step 2: the link's token and a new password.
// Logs out every device, then logs in here.
router.post("/auth/reset", async (req, res) => {
  const { token, password } = req.body;

  if (typeof token !== "string" || !token) {
    return res.status(400).json({ message: "This link isn't complete" });
  }
  const problem = passwordProblem(password);
  if (problem) return res.status(400).json({ message: problem });
  if (tooMany(`reset:${req.ip}`, 20)) return slowDown(res);

  try {
    const { rows } = await pool.query(
      `delete from password_resets where token_hash = $1 and expires_at > now()
       returning user_id`,
      [sha256(token)],
    );
    if (!rows.length) {
      return res
        .status(400)
        .json({ message: "This link has expired or was already used" });
    }

    const userId = rows[0].user_id;
    await pool.query("update users set password_hash = $1 where id = $2", [
      await makeHash(password),
      userId,
    ]);
    await pool.query("delete from sessions where user_id = $1", [userId]);
    await startSession(res, userId, false);
    res.json({ message: "Password changed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not reset the password" });
  }
});

// Change password: needs the current one, so nobody can do it on a computer left logged in.
// Every other session is logged out, the one in use stays.
router.post("/auth/password", requireUser, async (req, res) => {
  const { current, next } = req.body;

  if (typeof current !== "string" || typeof next !== "string") {
    return res.status(400).json({ message: "Fill in both passwords" });
  }
  const problem = passwordProblem(next);
  if (problem)
    return res.status(400).json({ message: `New p${problem.slice(1)}` });
  if (tooMany(`password:${req.userId}`, 5)) return slowDown(res);

  try {
    const { rows } = await pool.query(
      "select password_hash from users where id = $1",
      [req.userId],
    );
    if (!(await checkPassword(current, rows[0].password_hash))) {
      return res.status(400).json({ message: "Current password is wrong" });
    }

    await pool.query("update users set password_hash = $1 where id = $2", [
      await makeHash(next),
      req.userId,
    ]);
    await pool.query(
      "delete from sessions where user_id = $1 and token_hash <> $2",
      [req.userId, sha256(readCookie(req, COOKIE))],
    );
    res.json({ message: "Password changed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not change the password" });
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
