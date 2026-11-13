import { CATEGORIES } from "../shared/catalog.js";
import { getSeason } from "../shared/rules.js";

// Places in an outfit. The order also matters for outfitKey.
export const SLOTS = [
  "top",
  "bottom",
  "outerwear",
  "shoes",
  "bag",
  "accessory",
];

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

// localStorage keys in one place, so Home and Outfits can't mistype them
export const STORAGE = {
  outfit: "styleai.outfit.v1",
  saved: "styleai.saved.v1",
  favorites: "styleai.favorites.v1",
};

// Saved outfits: [{ key, slots, savedAt }]. Broken entries are skipped.
export function readSaved() {
  const value = readStorage(STORAGE.saved, []);
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => typeof entry?.key === "string" && entry.slots);
}

// A name to start with, like "Friday autumn look". It can be renamed later.
export function defaultOutfitName(date = new Date()) {
  const day = date.toLocaleDateString("en-US", { weekday: "long" });
  return `${day} ${getSeason(date).toLowerCase()} look`;
}

// Favorites are a list of outfit keys
export function readFavorites() {
  const value = readStorage(STORAGE.favorites, []);
  if (!Array.isArray(value)) return [];
  return value.filter((key) => typeof key === "string");
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
