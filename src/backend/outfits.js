import { Router } from "express";
import fs from "fs";

const router = Router();
const DATA_FILE = "outfits.json";

// Saved outfit: { id, key, name, slots, favorite, savedAt }
// slots is { top: itemId, bottom: itemId, ... }, key is that same outfit as text

function readOutfits() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveOutfits(outfits) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(outfits, null, 2) + "\n");
}

router.get("/outfits", (req, res) => {
  res.json(readOutfits());
});

router.post("/outfits", (req, res) => {
  const { key, name, slots, favorite } = req.body;

  if (typeof key !== "string" || !slots || typeof slots !== "object") {
    return res.status(400).json({ message: "Outfit is missing" });
  }
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Name is required" });
  }

  const outfits = readOutfits();

  // Same outfit saved twice? Just send back the one we already have.
  const existing = outfits.find((outfit) => outfit.key === key);
  if (existing) return res.json(existing);

  const newOutfit = {
    id: Date.now(),
    key,
    name: name.trim(),
    slots,
    favorite: Boolean(favorite),
    savedAt: new Date().toISOString(),
  };
  outfits.push(newOutfit);
  saveOutfits(outfits);

  res.status(201).json(newOutfit);
});

// Name, favorite and the pieces can change. Send only what changed.
router.patch("/outfits/:id", (req, res) => {
  const outfits = readOutfits();
  const outfit = outfits.find((outfit) => outfit.id === Number(req.params.id));
  if (!outfit) {
    return res.status(404).json({ message: "Outfit not found" });
  }

  const { name, favorite, slots, key } = req.body;
  if (slots !== undefined) {
    if (typeof key !== "string" || !slots || typeof slots !== "object") {
      return res.status(400).json({ message: "Outfit is missing" });
    }
    // Don't end up with the same outfit saved twice
    if (outfits.some((other) => other.key === key && other.id !== outfit.id)) {
      return res.status(400).json({ message: "This outfit is already saved" });
    }
    outfit.slots = slots;
    outfit.key = key;
  }
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Name can't be empty" });
    }
    outfit.name = name.trim();
  }
  if (favorite !== undefined) {
    outfit.favorite = Boolean(favorite);
  }

  saveOutfits(outfits);
  res.json(outfit);
});

router.delete("/outfits/:id", (req, res) => {
  const outfits = readOutfits();
  const rest = outfits.filter((outfit) => outfit.id !== Number(req.params.id));
  if (rest.length === outfits.length) {
    return res.status(404).json({ message: "Outfit not found" });
  }
  saveOutfits(rest);
  res.json({ message: "Outfit deleted" });
});

export default router;
