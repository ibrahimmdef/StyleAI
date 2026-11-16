import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { pool } from "./db.js";

const router = Router();
const upload = multer();

// Name, email and photo live on the user, notifications with the preferences
async function readProfile(userId) {
  const { rows } = await pool.query(
    `select users.name, users.email, users.photo, preferences.notifications
     from users join preferences on preferences.user_id = users.id
     where users.id = $1`,
    [userId],
  );
  return rows[0];
}

router.get("/profile", async (req, res) => {
  try {
    res.json(await readProfile(req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load profile" });
  }
});

router.put("/profile", async (req, res) => {
  const { name, email, notifications } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Name is required" });
  }
  // The email is how people log in, so it can't be empty
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({ message: "Enter a valid email" });
  }
  if (typeof notifications !== "boolean") {
    return res.status(400).json({ message: "Notifications is on or off" });
  }

  try {
    const userId = req.userId;
    // Emails are always saved in lower case
    await pool.query("update users set name = $1, email = $2 where id = $3", [
      name.trim(),
      email.trim().toLowerCase(),
      userId,
    ]);
    await pool.query(
      "update preferences set notifications = $1 where user_id = $2",
      [notifications, userId],
    );
    res.json(await readProfile(userId));
  } catch (err) {
    // Two accounts can't share an email
    if (err.code === "23505") {
      return res.status(400).json({ message: "That email is already used" });
    }
    console.error(err);
    res.status(500).json({ message: "Could not save profile" });
  }
});

// Small square photo. Names start with "avatar-" so the upload cleanup skips it.
router.post("/profile/photo", upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Photo is required" });
  }

  try {
    const output = await sharp(req.file.buffer)
      .rotate()
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    // avatar-<owner id>-..., see the /uploads check in server.js
    const fileName = `avatar-${req.userId}-${Date.now()}.webp`;
    await fs.promises.writeFile(path.join("uploads", fileName), output);

    // Throw away the old photo
    const userId = req.userId;
    const old = await readProfile(userId);
    if (old.photo) {
      fs.rmSync(path.join("uploads", path.basename(old.photo)), {
        force: true,
      });
    }

    // Only the path. The frontend knows where the server is.
    await pool.query("update users set photo = $1 where id = $2", [
      `/uploads/${fileName}`,
      userId,
    ]);
    res.status(201).json(await readProfile(userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save the photo" });
  }
});

export default router;
