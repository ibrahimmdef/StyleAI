const photo = name => `/images/${name}.png`;

// IDs stay stable: outfits save IDs, while images and metadata live here.
export const wardrobeItems = [
  { id: 'top-brown', slot: 'top', name: 'Chocolate Ribbed Top', category: 'Top', color: 'Brown', image: photo('brown-top') },
  { id: 'top-white', slot: 'top', name: 'Classic White T-Shirt', category: 'Top', color: 'White', image: photo('white-tee') },
  { id: 'bottom-black', slot: 'bottom', name: 'Black Wide-Leg Jeans', category: 'Bottoms', color: 'Black', image: photo('black-jeans') },
  { id: 'bottom-blue', slot: 'bottom', name: 'Straight Blue Jeans', category: 'Bottoms', color: 'Blue', image: photo('blue-jeans') },
  { id: 'layer-brown', slot: 'outerwear', name: 'Chocolate Leather Jacket', category: 'Outerwear', color: 'Brown', image: photo('brown-jacket') },
  { id: 'layer-beige', slot: 'outerwear', name: 'Beige Trench Coat', category: 'Outerwear', color: 'Beige', image: photo('beige-coat') },
  { id: 'shoes-brown', slot: 'shoes', name: 'Brown High-Top Sneakers', category: 'Shoes', color: 'Brown', image: photo('brown-sneakers') },
  { id: 'shoes-black', slot: 'shoes', name: 'Black Ankle Boots', category: 'Shoes', color: 'Black', image: photo('black-boots') },
  { id: 'bag-brown', slot: 'bag', name: 'Brown Shoulder Bag', category: 'Accessories', color: 'Brown', image: photo('brown-bag') },
  { id: 'bag-black', slot: 'bag', name: 'Black Shoulder Bag', category: 'Accessories', color: 'Black', image: photo('black-bag') },
  { id: 'glasses-black', slot: 'glasses', name: 'Cat-Eye Sunglasses', category: 'Accessories', color: 'Black', image: photo('sunglasses') },
  { id: 'earrings-gold', slot: 'earrings', name: 'Gold Hoop Earrings', category: 'Accessories', color: 'Gold', image: photo('gold-hoops') },
  { id: 'necklace-gold', slot: 'necklace', name: 'Gold Heart Necklace', category: 'Accessories', color: 'Gold', image: photo('necklace') },
];

export const itemById = Object.fromEntries(wardrobeItems.map(item => [item.id, item]));
export const slotLabels = {
  top: 'top', bottom: 'bottoms', outerwear: 'layer', shoes: 'shoes',
  bag: 'bag', glasses: 'sunglasses', earrings: 'earrings', necklace: 'necklace',
};
export const optionalSlots = ['outerwear', 'bag', 'glasses', 'earrings', 'necklace'];
export const defaultOutfit = {
  top: 'top-brown', bottom: 'bottom-black', outerwear: 'layer-brown',
  shoes: 'shoes-brown', bag: 'bag-brown', glasses: 'glasses-black',
  earrings: 'earrings-gold', necklace: 'necklace-gold',
};
export const outfitPresets = [
  defaultOutfit,
  { ...defaultOutfit, top: 'top-white', bottom: 'bottom-blue', outerwear: 'layer-beige', bag: 'bag-black' },
  { ...defaultOutfit, top: 'top-white', outerwear: null, shoes: 'shoes-black', bag: 'bag-black' },
];



// Kombin yoxlamaları və brauzer yaddaşı.

export const outfitKey = outfit => JSON.stringify(Object.keys(defaultOutfit).map(slot => [slot, outfit[slot] ?? null]));

export function normalizeOutfit(value) {
  return Object.fromEntries(Object.keys(defaultOutfit).map(slot => {
    const id = value?.[slot];
    if (id === null && optionalSlots.includes(slot)) return [slot, null];
    return [slot, itemById[id]?.slot === slot ? id : defaultOutfit[slot]];
  }));
}

export function replaceSlot(outfit, slot, itemId) {
  if (!Object.hasOwn(defaultOutfit, slot)) return outfit;
  if (itemId === null && optionalSlots.includes(slot)) return { ...outfit, [slot]: null };
  if (itemById[itemId]?.slot !== slot) return outfit;
  return { ...outfit, [slot]: itemId };
}

export function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
