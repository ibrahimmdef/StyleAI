import { Router } from "express";
import fs from "fs";
import path from "path";
import { checkItem } from "../shared/catalog.js";

const router = Router();
const DATA_FILE = "items.json";

function readItems() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveItems(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2) + "\n");
}

// Removes a photo from uploads. basename keeps only the file name,
// so a url like "../server.js" can't delete anything outside uploads.
function deletePhoto(imageUrl) {
  if (!imageUrl) return;
  const file = path.join("uploads", path.basename(imageUrl));
  fs.rm(file, { force: true }, (err) => {
    if (err) console.error("PHOTO DELETE ERROR:", err);
  });
}

// Deletes photos no item uses, e.g. someone uploaded a photo and hit Cancel.
// Only files older than an hour, so a photo that's being added right now is safe.
export function cleanUploads() {
  if (!fs.existsSync("uploads")) return;

  const used = readItems().map((item) => path.basename(item.image ?? ""));
  const hourAgo = Date.now() - 60 * 60 * 1000;

  for (const name of fs.readdirSync("uploads")) {
    const file = path.join("uploads", name);
    if (used.includes(name) || fs.statSync(file).mtimeMs > hourAgo) continue;
    fs.rmSync(file, { force: true });
    console.log("Removed unused photo:", name);
  }
}

router.get("/Items", (req, res) => {
  res.json(readItems());
});

router.get("/Items/:id", (req, res) => {
  const item = readItems().find((item) => item.id === Number(req.params.id));
  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }
  res.json(item);
});

router.put("/Items/:id", (req, res) => {
  const { name, category, type, color, seasons, styles, image } = req.body;

  const problem = checkItem(req.body);
  if (problem) {
    return res.status(400).json({ message: problem });
  }

  const items = readItems();
  const index = items.findIndex((item) => item.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: "Item not found" });
  }

  // New photo picked: the old one isn't needed anymore
  if (items[index].image !== image) {
    deletePhoto(items[index].image);
  }

  // Keep the id, replace everything else
  items[index] = {
    id: items[index].id,
    name,
    category,
    type,
    color,
    seasons,
    styles,
    image,
  };
  saveItems(items);

  res.json(items[index]);
});

router.delete("/Items/:id", (req, res) => {
  const items = readItems();
  const item = items.find((item) => item.id === Number(req.params.id));
  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }

  saveItems(items.filter((other) => other.id !== item.id));
  deletePhoto(item.image);
  res.json({ message: "Item deleted" });
});

router.post("/Items", (req, res) => {
  const { name, category, type, color, seasons, styles, image } = req.body;

  if (!image) {
    return res.status(400).json({ message: "Image is required" });
  }

  // Only categories and types from the catalog, so the AI can trust the data
  const problem = checkItem(req.body);
  if (problem) {
    return res.status(400).json({ message: problem });
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
