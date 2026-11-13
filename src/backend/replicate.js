import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { removeBackground } from "@imgly/background-removal-node";

const router = Router();
const upload = multer();

router.post("/process-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const resized = await sharp(req.file.buffer)
      .rotate()
      .resize({
        width: 1024,
        height: 1024,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    const image = new Blob([resized], { type: "image/png" });
    const result = await removeBackground(image);
    const noBg = Buffer.from(await result.arrayBuffer());

    // Cut away the empty transparent space around the item
    const output = await sharp(noBg).trim().webp({ quality: 80 }).toBuffer();

    const fileName = `${Date.now()}.webp`;
    await fs.promises.writeFile(path.join("uploads", fileName), output);

    const port = process.env.PORT || 5000;
    res.status(201).json({
      image: `http://localhost:${port}/uploads/${fileName}`,
    });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;
