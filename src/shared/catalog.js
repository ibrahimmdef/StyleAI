// The one list of categories, types, colors, seasons and styles.
// Frontend, backend and later the AI all read from here, so they always agree.

// Each category says which outfit slot its items go into
export const CATEGORIES = {
  Tops: {
    slot: "top",
    types: ["T-shirt", "Shirt", "Blouse", "Polo", "Sweater", "Hoodie"],
  },
  Bottoms: {
    slot: "bottom",
    types: ["Jeans", "Trousers", "Shorts", "Skirt"],
  },
  Outerwear: {
    slot: "outerwear",
    types: ["Jacket", "Coat", "Blazer", "Cardigan", "Vest"],
  },
  Shoes: {
    slot: "shoes",
    types: ["Sneakers", "Boots", "Loafers", "Dress shoes", "Sandals", "Heels"],
  },
  Bags: {
    slot: "bag",
    types: ["Handbag", "Shoulder bag", "Tote", "Backpack"],
  },
  Accessories: {
    slot: "accessory",
    types: ["Watch", "Hat", "Sunglasses", "Belt", "Scarf", "Jewelry"],
  },
};

export const COLORS = {
  Black: "#1c1c1e",
  White: "#ffffff",
  Gray: "#8a8d93",
  Beige: "#dcc5a1",
  Brown: "#6b4226",
  Blue: "#1f4e8c",
  Green: "#4b6b3c",
  Red: "#b3261e",
  Yellow: "#e0a800",
};

export const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];

export const STYLES = [
  "Casual",
  "Smart casual",
  "Formal",
  "Minimal",
  "Classic",
  "Sporty",
  "Streetwear",
  "Vintage",
];

// What an outfit is for
export const OCCASIONS = ["Casual", "Work", "Evening", "Sport"];

// Checks an item before it's saved. Returns an error message, or null if it's fine.
export function checkItem(item) {
  const category = CATEGORIES[item.category];
  if (!category) return "Unknown category.";
  if (!category.types.includes(item.type))
    return "Unknown type for this category.";
  if (!COLORS[item.color]) return "Unknown color.";
  if (!item.seasons?.every((season) => SEASONS.includes(season)))
    return "Unknown season.";
  if (!item.styles?.every((style) => STYLES.includes(style)))
    return "Unknown style.";
  return null;
}

// The AI stylist's name. The prompt box and the AI's instructions both use it.
export const STYLIST = "Stella";
