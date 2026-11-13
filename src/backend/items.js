import { Router } from "express";
import fs from "fs";
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
  const rest = items.filter((item) => item.id !== Number(req.params.id));
  if (rest.length === items.length) {
    return res.status(404).json({ message: "Item not found" });
  }
  saveItems(rest);
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
