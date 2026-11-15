import { Router } from "express";
import fs from "fs";

const router = Router();
const DATA_FILE = "profile.json";

// What a new user starts with
const DEFAULTS = {
  name: "User",
  email: "",
  notifications: true,
};

function readProfile() {
  if (!fs.existsSync(DATA_FILE)) return DEFAULTS;
  return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
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

  const profile = { name: name.trim(), email: email.trim(), notifications };
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(profile, null, 2) + "\n");
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save profile" });
  }
});

export default router;
