import "dotenv/config";
import fs from "fs";
import express from "express";

import aiRoutes from "./ai.js";
import authRoutes, { requireUser } from "./auth.js";
import itemsRoutes, { cleanUploads } from "./items.js";
import outfitsRoutes from "./outfits.js";
import preferencesRoutes from "./preferences.js";
import profileRoutes from "./profile.js";
import replicateRoutes from "./replicate.js";
import weatherRoutes from "./weather.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
// Photos go here. Git doesn't keep empty folders, so make it on a fresh copy.
fs.mkdirSync("uploads", { recursive: true });
// Photos are private: only the owner sees them. The file name starts with the
// owner's id ("7-1794....webp", or "avatar-7-....webp" for profile photos).
function ownPhoto(req, res, next) {
  const name = req.path.slice(1);
  const mine =
    name.startsWith(`${req.userId}-`) ||
    name.startsWith(`avatar-${req.userId}-`);
  if (!mine) return res.status(404).json({ message: "Photo not found" });
  next();
}
app.use("/uploads", requireUser, ownPhoto, express.static("uploads"));

// Open to everyone: signing up and in, and the weather
app.use("/api", authRoutes);
app.use("/api", weatherRoutes);

// Everything after this needs a logged-in user (sets req.userId)
app.use("/api", requireUser);
app.use("/api", aiRoutes);
app.use("/api", itemsRoutes);
app.use("/api", outfitsRoutes);
app.use("/api", preferencesRoutes);
app.use("/api", profileRoutes);
app.use("/api", replicateRoutes);

// Clear leftover photos on start, then once an hour
cleanUploads();
setInterval(cleanUploads, 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
