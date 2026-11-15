import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const router = Router();
const upload = multer();
const DATA_FILE = "profile.json";

// What a new user starts with
const DEFAULTS = {
  name: "User",
  email: "",
  photo: "",
  notifications: true,
};

function readProfile() {
  if (!fs.existsSync(DATA_FILE)) return DEFAULTS;
  return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
}

function writeProfile(profile) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(profile, null, 2) + "\n");
}

router.get("/profile", (req, res) => {
  res.json(readProfile());
});

router.put("/profile", (req, res) => {
  const { name, email, notifications } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Name is required" });
  }
  // Email can be left empty, but if it's there it needs an @
  if (typeof email !== "string" || (email && !email.includes("@"))) {
    return res.status(400).json({ message: "Email doesn't look right" });
  }
  if (typeof notifications !== "boolean") {
    return res.status(400).json({ message: "Notifications is on or off" });
  }

  // The photo has its own route, keep whatever is there
  const profile = {
    ...readProfile(),
    name: name.trim(),
    email: email.trim(),
    notifications,
  };
  try {
    writeProfile(profile);
    res.json(profile);
  } catch (err) {
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

    const fileName = `avatar-${Date.now()}.webp`;
    await fs.promises.writeFile(path.join("uploads", fileName), output);

    // Throw away the old photo
    const profile = readProfile();
    if (profile.photo) {
      const old = path.join("uploads", path.basename(profile.photo));
      fs.rmSync(old, { force: true });
    }

    const port = process.env.PORT || 5000;
    profile.photo = `http://localhost:${port}/uploads/${fileName}`;
    writeProfile(profile);
    res.status(201).json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save the photo" });
  }
});

export default router;
