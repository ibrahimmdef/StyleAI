import { CATEGORIES, SEASONS, STYLES } from "../shared/catalog.js";
import { fitsSeason, getSeason } from "../shared/rules.js";

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

// Tags for an outfit: its occasion, styles every piece shares, seasons every piece fits
export function outfitTags(pieces, occasion) {
  if (pieces.length === 0) return occasion ? [occasion] : [];
  const styles = STYLES.filter((style) =>
    pieces.every((item) => item.styles?.includes(style)),
  );
  const seasons = SEASONS.filter((season) =>
    pieces.every((item) => fitsSeason(item, season)),
  );
  // Fits every season? Then the season says nothing, leave it out.
  const tags = [
    occasion,
    ...styles,
    ...(seasons.length === SEASONS.length ? [] : seasons),
  ];
  return [...new Set(tags.filter(Boolean))].slice(0, 3);
}

// localStorage keys in one place, so Home and Outfits can't mistype them
// Only today's outfit stays in the browser. Saved outfits live on the backend.
export const STORAGE = {
  outfit: "styleai.outfit.v1",
  consent: "styleai.consent.v1",
};

// Without consent, things are only kept until the tab is closed.
// The consent answer itself always stays, or we'd ask every time.
function storageFor(key) {
  if (key === STORAGE.consent) return localStorage;
  const consent = JSON.parse(localStorage.getItem(STORAGE.consent));
  return consent?.preferences ? localStorage : sessionStorage;
}

// A name to start with, like "Friday autumn look". It can be renamed later.
export function defaultOutfitName(date = new Date()) {
  const day = date.toLocaleDateString("en-US", { weekday: "long" });
  return `${day} ${getSeason(date).toLowerCase()} look`;
}

export function readStorage(key, fallback) {
  try {
    return JSON.parse(storageFor(key).getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    storageFor(key).setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
