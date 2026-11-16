// Simple outfit rules. The random generator uses them now, the AI can use them later.

// Below this temperature (°C) an outfit needs a jacket or coat
export const LAYER_TEMP = 18;

// Season for a date (northern hemisphere)
export function getSeason(date = new Date()) {
  const month = date.getMonth(); // 0 = January
  if (month === 11 || month <= 1) return "Winter";
  if (month <= 4) return "Spring";
  if (month <= 7) return "Summer";
  return "Autumn";
}

// Is it cold enough for a layer? coldTolerance is the 1-5 slider on Preferences:
// 1 wears light, 5 feels the cold. Each step moves the line by 3 degrees,
// so 1 -> under 12°C, 3 -> under 18°C, 5 -> under 24°C.
export function needsLayer(temp, coldTolerance = 3) {
  return temp < LAYER_TEMP + (coldTolerance - 3) * 3;
}

// Can this item be worn in this season? Items with no seasons work any time.
export function fitsSeason(item, season) {
  return !item.seasons?.length || item.seasons.includes(season);
}

// Pieces in a color the user avoids are left out. Nothing avoided, everything goes.
export function allowedColor(item, avoidColors = []) {
  return !avoidColors.includes(item.color);
}

// Does the piece match one of the user's styles? Pieces with no styles match any.
export function fitsStyle(item, styles = []) {
  if (!item.styles?.length || !styles.length) return true;
  return item.styles.some((style) => styles.includes(style));
}

// Keeps the items that pass the check. If none pass, keeps them all,
// because something is better than an empty slot.
export function preferWhere(items, check) {
  const good = items.filter(check);
  return good.length ? good : items;
}
