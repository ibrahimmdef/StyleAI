import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultOutfit } from '../src/data.js';
import { normalizeOutfit, outfitKey, readStorage, replaceSlot, writeStorage } from '../src/data.js';

test('restores valid saved items and rejects missing or wrong-category IDs', () => {
  const result = normalizeOutfit({ ...defaultOutfit, top: 'shoes-black', bottom: 'deleted-item', outerwear: null });
  assert.equal(result.top, defaultOutfit.top);
  assert.equal(result.bottom, defaultOutfit.bottom);
  assert.equal(result.outerwear, null);
});

test('required pieces cannot be removed; optional layers can be removed and restored', () => {
  assert.deepEqual(replaceSlot(defaultOutfit, 'top', null), defaultOutfit);
  const withoutLayer = replaceSlot(defaultOutfit, 'outerwear', null);
  assert.equal(withoutLayer.outerwear, null);
  assert.equal(Object.values(withoutLayer).filter(Boolean).length, 7);
  assert.equal(replaceSlot(withoutLayer, 'outerwear', 'layer-beige').outerwear, 'layer-beige');
});

test('swaps cannot put an accessory or unknown item in a clothing slot', () => {
  assert.deepEqual(replaceSlot(defaultOutfit, 'shoes', 'bag-brown'), defaultOutfit);
  assert.deepEqual(replaceSlot(defaultOutfit, 'unknown', 'shoes-black'), defaultOutfit);
  assert.deepEqual(replaceSlot(defaultOutfit, 'top', 'missing'), defaultOutfit);
});

test('outfit key is stable regardless of property order and changes with selections', () => {
  assert.equal(outfitKey(defaultOutfit), outfitKey(Object.fromEntries(Object.entries(defaultOutfit).reverse())));
  assert.notEqual(outfitKey(defaultOutfit), outfitKey({ ...defaultOutfit, outerwear: null }));
});

test('invalid, unavailable and full browser storage fails safely', () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => '{broken', setItem: () => { throw new Error('Quota exceeded'); } };
  try {
    assert.deepEqual(readStorage('test', []), []);
    assert.equal(writeStorage('test', {}), false);
  } finally { globalThis.localStorage = previous; }
});
