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

// Is it cold enough for a layer?
export function needsLayer(temp) {
  return temp < LAYER_TEMP;
}

// Can this item be worn in this season? Items with no seasons work any time.
export function fitsSeason(item, season) {
  return !item.seasons?.length || item.seasons.includes(season);
}
