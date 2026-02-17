import assert from 'assert';
import fs from 'fs';
import { getDialectRomanization, getMandarinPinyin } from '../pronunciation_core.mjs';

const romanizationJson = JSON.parse(fs.readFileSync('./dialect_romanization.json', 'utf8'));

const TERM_GU_MA = '\u59d1\u5988';
const TERM_GU_BIAO_GE = '\u59d1\u8868\u54e5';
const TERM_UNMAPPED = '\u638c\u4e0a\u660e\u73e0';

// Uses explicit curated dialect override when present.
const overrideHit = getDialectRomanization(TERM_GU_MA, 'cantonese_sg', romanizationJson, 'gu ma');
assert.ok(overrideHit);
assert.strictEqual(overrideHit.text, 'gu maa1');
assert.strictEqual(overrideHit.systemName, 'Jyutping');
assert.strictEqual(overrideHit.isFallback, false);

// Uses Cantonese char-map generation for cousin terms (no Mandarin fallback badge).
const charMapHit = getDialectRomanization(TERM_GU_BIAO_GE, 'cantonese_sg', romanizationJson, null);
assert.ok(charMapHit);
assert.strictEqual(charMapHit.text, 'gu1 biu2 go1');
assert.strictEqual(charMapHit.systemName, 'Jyutping');
assert.strictEqual(charMapHit.isFallback, false);

// Falls back to provided Mandarin pinyin when no Cantonese mapping is available.
const runtimeFallback = getDialectRomanization('__missing_term__', 'cantonese_sg', romanizationJson, 'ce shi');
assert.ok(runtimeFallback);
assert.strictEqual(runtimeFallback.text, 'ce shi');
assert.strictEqual(runtimeFallback.isFallback, true);

// Falls back to embedded Mandarin map when runtime pinyin is unavailable.
const mapFallback = getDialectRomanization(TERM_UNMAPPED, 'cantonese_sg', romanizationJson, null);
assert.ok(mapFallback);
assert.strictEqual(mapFallback.systemName, 'Jyutping');
assert.strictEqual(mapFallback.isFallback, true);
assert.ok(typeof mapFallback.text === 'string' && mapFallback.text.length > 0);

// Returns null when neither dialect nor Mandarin fallback is available.
const missingBoth = getDialectRomanization('__missing_term__', 'cantonese_sg', romanizationJson, null);
assert.strictEqual(missingBoth, null);

// Mandarin dialect should not render a duplicate second line.
const mandarinMode = getDialectRomanization(TERM_GU_MA, 'mandarin_standard', romanizationJson, 'gu ma');
assert.strictEqual(mandarinMode, null);

// Deterministic output for sample terms across dialect ids.
const sampleDialectIds = ['cantonese_sg', 'hokkien_sg', 'teochew_sg', 'hakka_sg', 'hainanese_sg', 'custom'];
sampleDialectIds.forEach((dialectId) => {
  const first = getDialectRomanization(TERM_GU_MA, dialectId, romanizationJson, 'gu ma');
  const second = getDialectRomanization(TERM_GU_MA, dialectId, romanizationJson, 'gu ma');
  assert.deepStrictEqual(first, second, `Expected deterministic romanization for ${dialectId}`);
});

// Mandarin pinyin helper handles array output and failure safely.
const pinyinStub = (term, opts) => (opts?.type === 'array' ? ['gu1', 'ma1'] : 'gu1 ma1');
assert.strictEqual(getMandarinPinyin(TERM_GU_MA, pinyinStub), 'gu1 ma1');

const throwingStub = () => {
  throw new Error('boom');
};
assert.strictEqual(getMandarinPinyin(TERM_GU_MA, throwingStub), null);

console.log('All romanization tests passed.');
