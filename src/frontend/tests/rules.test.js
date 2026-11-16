import test from "node:test";
import assert from "node:assert/strict";
import {
  allowedColor,
  fitsSeason,
  fitsStyle,
  getSeason,
  needsLayer,
  preferWhere,
} from "../../shared/rules.js";

test("months map to the right season", () => {
  assert.equal(getSeason(new Date(2026, 0, 10)), "Winter");
  assert.equal(getSeason(new Date(2026, 3, 10)), "Spring");
  assert.equal(getSeason(new Date(2026, 6, 10)), "Summer");
  assert.equal(getSeason(new Date(2026, 10, 14)), "Autumn");
  assert.equal(getSeason(new Date(2026, 11, 1)), "Winter");
});

test("cold days need a layer, warm days don't", () => {
  assert.equal(needsLayer(5), true);
  assert.equal(needsLayer(17), true);
  assert.equal(needsLayer(18), false);
  assert.equal(needsLayer(30), false);
});

test("cold tolerance moves the layer line", () => {
  // 15°C: someone who wears light skips the jacket, someone who feels the cold doesn't
  assert.equal(needsLayer(15, 1), false);
  assert.equal(needsLayer(15, 3), true);
  assert.equal(needsLayer(15, 5), true);
  assert.equal(needsLayer(11, 1), true);
  assert.equal(needsLayer(23, 5), true);
  assert.equal(needsLayer(24, 5), false);
});

test("items fit their seasons, items with no seasons fit any", () => {
  assert.equal(fitsSeason({ seasons: ["Winter"] }, "Winter"), true);
  assert.equal(fitsSeason({ seasons: ["Summer"] }, "Winter"), false);
  assert.equal(fitsSeason({ seasons: [] }, "Winter"), true);
  assert.equal(fitsSeason({}, "Winter"), true);
});

test("avoided colors are left out", () => {
  const red = { color: "Red" };
  assert.equal(allowedColor(red, ["Red", "Brown"]), false);
  assert.equal(allowedColor(red, ["Brown"]), true);
  assert.equal(allowedColor(red, []), true);
  assert.equal(allowedColor(red), true);
});

test("pieces match the user's styles", () => {
  const sporty = { styles: ["Sporty"] };
  assert.equal(fitsStyle(sporty, ["Casual", "Sporty"]), true);
  assert.equal(fitsStyle(sporty, ["Formal"]), false);
  assert.equal(fitsStyle({ styles: [] }, ["Formal"]), true);
  assert.equal(fitsStyle(sporty, []), true);
});

test("preferWhere falls back to everything when nothing passes", () => {
  const items = [1, 2, 3, 4];
  assert.deepEqual(
    preferWhere(items, (n) => n > 2),
    [3, 4],
  );
  assert.deepEqual(
    preferWhere(items, (n) => n > 9),
    [1, 2, 3, 4],
  );
});
