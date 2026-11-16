import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { removeBackground } from "@imgly/background-removal-node";

const router = Router();
const upload = multer();

// Takes any photo of a piece and gives back a webp with the background removed,
// saved in uploads as "<owner id>-<time>.webp". Returns the path, like "/uploads/7-1794....webp".
// Add Item uses it through the route below, import-photos.js uses it directly.
export async function cutOut(photo, ownerId) {
  const resized = await sharp(photo)
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

  // The owner's id comes first, that's how /uploads knows whose photo it is
  const fileName = `${ownerId}-${Date.now()}.webp`;
  await fs.promises.writeFile(path.join("uploads", fileName), output);
  // Only the path. The frontend knows where the server is.
  return `/uploads/${fileName}`;
}

router.post("/process-image", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image is required" });
  }

  try {
    res.status(201).json({ image: await cutOut(req.file.buffer, req.userId) });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;
