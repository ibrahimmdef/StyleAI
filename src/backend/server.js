import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { removeBackground } from "@imgly/background-removal-node";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());

app.use("/uploads", express.static("uploads"));

const upload = multer();

app.post("/api/Items", upload.single("image"), async (req, res) => {
  console.log(" Form fields:", req.body);
  console.log(
    " File info:",
    req.file?.originalname,
    req.file?.mimetype,
    req.file?.size / 1024 / 1024 + " MB",
  );

  try {
    //image control
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // delete bg

    const image = new Blob([req.file.buffer], { type: req.file.mimetype });
    const result = await removeBackground(image);
    const buffer = Buffer.from(await result.arrayBuffer());

    // add uploads
    const fileName = `${Date.now()}.png`;

    await fs.promises.writeFile(path.join("uploads", fileName), buffer);

    res.status(201).json({ message: "Item received", file: fileName });
    console.log(" Response sent to React");
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
