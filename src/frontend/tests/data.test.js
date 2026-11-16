import test from "node:test";
import assert from "node:assert/strict";
import { getSlot, outfitKey } from "../data.js";

test("wardrobe items land in the right slot", () => {
  assert.equal(getSlot({ category: "Tops", type: "Shirt" }), "top");
  assert.equal(getSlot({ category: "Shoes", type: "Boots" }), "shoes");
  assert.equal(getSlot({ category: "Bags", type: "Handbag" }), "bag");
  assert.equal(
    getSlot({ category: "Accessories", type: "Watch" }),
    "accessory",
  );
  assert.equal(
    getSlot({ category: "Accessories", type: "Jewelry" }),
    "jewelry",
  );
  assert.equal(getSlot({ category: "Something else" }), null);
});

test("outfit key doesn't care about property order", () => {
  assert.equal(
    outfitKey({ top: 1, shoes: 2 }),
    outfitKey({ shoes: 2, top: 1 }),
  );
  assert.notEqual(outfitKey({ top: 1 }), outfitKey({ top: 2 }));
});

test("outfits without jewelry keep their old key", () => {
  // The key from before the jewelry place existed
  assert.equal(outfitKey({ top: 1, bottom: 2, shoes: 3 }), "1|2|-|3|-|-");
  assert.equal(
    outfitKey({ top: 1, bottom: 2, shoes: 3, jewelry: 4 }),
    "1|2|-|3|-|-|4",
  );
});
