import "dotenv/config";
import fs from "fs";
import express from "express";
import cors from "cors";

import aiRoutes from "./ai.js";
import itemsRoutes, { cleanUploads } from "./items.js";
import outfitsRoutes from "./outfits.js";
import preferencesRoutes from "./preferences.js";
import profileRoutes from "./profile.js";
import replicateRoutes from "./replicate.js";
import weatherRoutes from "./weather.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
// Photos go here. Git doesn't keep empty folders, so make it on a fresh copy.
fs.mkdirSync("uploads", { recursive: true });
app.use("/uploads", express.static("uploads"));

app.use("/api", aiRoutes);
app.use("/api", itemsRoutes);
app.use("/api", outfitsRoutes);
app.use("/api", preferencesRoutes);
app.use("/api", profileRoutes);
app.use("/api", replicateRoutes);
app.use("/api", weatherRoutes);

// Clear leftover photos on start, then once an hour
cleanUploads();
setInterval(cleanUploads, 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
