import { Router } from "express";
import fs from "fs";

const router = Router();
const DATA_FILE = "items.json";

function readItems() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveItems(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items));
}

router.get("/Items", (req, res) => {
  res.json(readItems());
});

router.post("/Items", (req, res) => {
  const { name, category, type, color, seasons, styles, image } = req.body;

  if (!image) {
    return res.status(400).json({ message: "Image is required" });
  }

  const newItem = {
    id: Date.now(),
    name,
    category,
    type,
    color,
    seasons,
    styles,
    image,
  };

  const items = readItems();
  items.push(newItem);
  saveItems(items);

  res.status(201).json(newItem);
});

export default router;
