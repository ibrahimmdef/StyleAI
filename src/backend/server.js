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

const DATA_FILE = "items.json";

function readItems() {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const text = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(text);
}

function saveItems(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items));
}

app.get("/api/Items", (req, res) => {
  res.json(readItems());
});

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

    // resize + fix rotation, output PNG
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
    // delete bg

    const image = new Blob([resized], { type: "image/png" });
    const result = await removeBackground(image);
    const noBg = Buffer.from(await result.arrayBuffer());

    //  compress to webp
    const output = await sharp(noBg).webp({ quality: 80 }).toBuffer();

    // add uploads

    const fileName = `${Date.now()}.webp`;

    await fs.promises.writeFile(path.join("uploads", fileName), output);

    const newItem = {
      id: Date.now(),
      name: req.body.name,
      category: req.body.category,
      type: req.body.type,
      color: req.body.color,
      seasons: JSON.parse(req.body.seasons),
      styles: JSON.parse(req.body.styles),
      image: `http://localhost:${port}/uploads/${fileName}`,
    };

    const items = readItems();
    items.push(newItem);
    saveItems(items);

    res.status(201).json(newItem);
    console.log("Item received:", newItem);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
