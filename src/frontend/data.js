import { CATEGORIES } from "../shared/catalog.js";

// Places in an outfit. The order also matters for outfitKey.
export const SLOTS = ["top", "bottom", "outerwear", "shoes", "bag", "accessory"];

// These can be left empty
export const OPTIONAL_SLOTS = ["outerwear", "bag", "accessory"];

// Names shown in the UI
export const SLOT_LABELS = {
  top: "top",
  bottom: "bottoms",
  outerwear: "layer",
  shoes: "shoes",
  bag: "bag",
  accessory: "accessory",
};

// Figures out where a wardrobe item goes in an outfit
export function getSlot(item) {
  return CATEGORIES[item.category]?.slot ?? null;
}

// Turns an outfit into a string so two outfits are easy to compare: "12|34|-|56|-|-"
export function outfitKey(outfit) {
  return SLOTS.map((slot) => outfit[slot] ?? "-").join("|");
}

export function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
