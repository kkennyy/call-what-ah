import assert from 'assert';
import fs from 'fs';
import { getDialectRomanization, getMandarinPinyin } from '../pronunciation_core.mjs';

const romanizationJson = JSON.parse(fs.readFileSync('./dialect_romanization.json', 'utf8'));

// Uses explicit dialect override when present.
const overrideHit = getDialectRomanization('姑妈', 'cantonese_sg', romanizationJson, 'gu ma');
assert.ok(overrideHit);
assert.strictEqual(overrideHit.text, 'gu maa1');
assert.strictEqual(overrideHit.systemName, 'Jyutping');
assert.strictEqual(overrideHit.isFallback, false);

// Falls back to Mandarin pinyin when no override is available.
const fallbackHit = getDialectRomanization('奶奶', 'cantonese_sg', romanizationJson, 'nai nai');
assert.ok(fallbackHit);
assert.strictEqual(fallbackHit.text, 'nai nai');
assert.strictEqual(fallbackHit.systemName, 'Jyutping');
assert.strictEqual(fallbackHit.isFallback, true);

// Falls back to embedded Mandarin map when runtime pinyin is unavailable.
const mapFallback = getDialectRomanization('奶奶', 'cantonese_sg', romanizationJson, null);
assert.ok(mapFallback);
assert.strictEqual(mapFallback.systemName, 'Jyutping');
assert.strictEqual(mapFallback.isFallback, true);
assert.ok(typeof mapFallback.text === 'string' && mapFallback.text.length > 0);

// Returns null when neither override nor Mandarin fallback is available.
const missingBoth = getDialectRomanization('__missing_term__', 'cantonese_sg', romanizationJson, null);
assert.strictEqual(missingBoth, null);

// Mandarin dialect should not render a duplicate second line.
const mandarinMode = getDialectRomanization('姑妈', 'mandarin_standard', romanizationJson, 'gu ma');
assert.strictEqual(mandarinMode, null);

// Deterministic output for sample terms across dialect ids.
const sampleDialectIds = ['cantonese_sg', 'hokkien_sg', 'teochew_sg', 'hakka_sg', 'hainanese_sg', 'custom'];
sampleDialectIds.forEach((dialectId) => {
  const first = getDialectRomanization('姑妈', dialectId, romanizationJson, 'gu ma');
  const second = getDialectRomanization('姑妈', dialectId, romanizationJson, 'gu ma');
  assert.deepStrictEqual(first, second, `Expected deterministic romanization for ${dialectId}`);
});

// Mandarin pinyin helper handles array output and failure safely.
const pinyinStub = (term, opts) => (opts?.type === 'array' ? ['gu1', 'ma1'] : 'gu1 ma1');
assert.strictEqual(getMandarinPinyin('姑妈', pinyinStub), 'gu1 ma1');

const throwingStub = () => {
  throw new Error('boom');
};
assert.strictEqual(getMandarinPinyin('姑妈', throwingStub), null);

console.log('All romanization tests passed.');
