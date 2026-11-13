import test from "node:test";
import assert from "node:assert/strict";
import { getSlot, outfitKey } from "../data.js";

test("wardrobe items land in the right slot", () => {
  assert.equal(getSlot({ category: "Tops", type: "Shirt" }), "top");
  assert.equal(getSlot({ category: "Shoes", type: "Boots" }), "shoes");
  assert.equal(getSlot({ category: "Accessories", type: "Bag" }), "bag");
  assert.equal(getSlot({ category: "Accessories", type: "Watches" }), "accessory");
});

test("outfit key doesn't care about property order", () => {
  assert.equal(outfitKey({ top: 1, shoes: 2 }), outfitKey({ shoes: 2, top: 1 }));
  assert.notEqual(outfitKey({ top: 1 }), outfitKey({ top: 2 }));
});
