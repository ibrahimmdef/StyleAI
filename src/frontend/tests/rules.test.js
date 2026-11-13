import test from "node:test";
import assert from "node:assert/strict";
import { fitsSeason, getSeason, needsLayer } from "../../shared/rules.js";

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

test("items fit their seasons, items with no seasons fit any", () => {
  assert.equal(fitsSeason({ seasons: ["Winter"] }, "Winter"), true);
  assert.equal(fitsSeason({ seasons: ["Summer"] }, "Winter"), false);
  assert.equal(fitsSeason({ seasons: [] }, "Winter"), true);
  assert.equal(fitsSeason({}, "Winter"), true);
});
