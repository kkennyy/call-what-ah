import assert from 'assert';
import fs from 'fs';
import {
  buildSelector,
  resolveConcept,
  selectTerms,
  selectorToGenericConceptId
} from '../kinship_core.mjs';

const stepsJson = JSON.parse(fs.readFileSync('./kinship_en_steps.json', 'utf8'));
const dialectJson = JSON.parse(fs.readFileSync('./dialect_variants.json', 'utf8'));
const stepsById = Object.fromEntries(stepsJson.steps.map((s) => [s.id, s]));

function chain(ids) {
  return ids.map((id) => ({ stepId: id, rank: null }));
}

function testConcept(ids, expectedConceptId, reverse = false, sex = -1) {
  const resolved = resolveConcept({
    chain: chain(ids),
    stepsById,
    reverse,
    sex,
    dialectData: dialectJson
  });
  assert.strictEqual(resolved.conceptId, expectedConceptId, `Expected ${expectedConceptId} for ${ids.join(' > ')}`);
  return resolved;
}

function testResolved(ids, reverse = false, sex = -1) {
  const resolved = resolveConcept({
    chain: chain(ids),
    stepsById,
    reverse,
    sex,
    dialectData: dialectJson
  });
  assert.ok(resolved.conceptId && typeof resolved.conceptId === 'string', 'conceptId should be non-empty string');
  return resolved;
}

// Core selector derivation sanity
assert.strictEqual(buildSelector(chain(['father', 'olderBrother']), stepsById), 'f,ob');
assert.strictEqual(buildSelector(chain(['father', 'brotherAgeUnknown', 'son']), stepsById), 'f,xb,s');
assert.strictEqual(buildSelector(chain(['mother', 'sisterAgeUnknown', 'daughter']), stepsById), 'm,xs,d');

// 40+ representative deterministic concept checks
const checks = [
  [['father', 'olderBrother'], 'paternal_uncle_elder'],
  [['father', 'youngerBrother'], 'paternal_uncle_younger'],
  [['father', 'brotherAgeUnknown'], 'paternal_uncle_unspecified'],
  [['father', 'olderSister'], 'paternal_aunt_elder'],
  [['father', 'youngerSister'], 'paternal_aunt_younger'],
  [['father', 'sisterAgeUnknown'], 'paternal_aunt_unspecified'],
  [['mother', 'brotherAgeUnknown'], 'maternal_uncle'],
  [['mother', 'sisterAgeUnknown'], 'maternal_aunt'],
  [['father', 'father'], 'paternal_grandfather'],
  [['father', 'mother'], 'paternal_grandmother'],
  [['mother', 'father'], 'maternal_grandfather'],
  [['mother', 'mother'], 'maternal_grandmother'],
  [['father', 'olderBrother', 'wife'], 'paternal_uncle_elder_spouse'],
  [['father', 'youngerBrother', 'wife'], 'paternal_uncle_younger_spouse'],
  [['father', 'olderSister', 'husband'], 'paternal_aunt_elder_spouse'],
  [['father', 'youngerSister', 'husband'], 'paternal_aunt_younger_spouse'],
  [['mother', 'brotherAgeUnknown', 'wife'], 'maternal_uncle_spouse'],
  [['mother', 'sisterAgeUnknown', 'husband'], 'maternal_aunt_spouse'],
  [['father', 'brotherAgeUnknown', 'son'], 'cousin_paternal_male_unspecified'],
  [['father', 'brotherAgeUnknown', 'daughter'], 'cousin_paternal_female_unspecified'],
  [['father', 'olderBrother', 'son'], 'cousin_paternal_male_unspecified'],
  [['father', 'youngerBrother', 'son'], 'cousin_paternal_male_unspecified'],
  [['father', 'olderBrother', 'daughter'], 'cousin_paternal_female_unspecified'],
  [['father', 'youngerBrother', 'daughter'], 'cousin_paternal_female_unspecified'],
  [['father', 'olderSister', 'son'], 'cousin_auntline_male_unspecified'],
  [['father', 'youngerSister', 'son'], 'cousin_auntline_male_unspecified'],
  [['father', 'olderSister', 'daughter'], 'cousin_auntline_female_unspecified'],
  [['father', 'youngerSister', 'daughter'], 'cousin_auntline_female_unspecified'],
  [['mother', 'brotherAgeUnknown', 'son'], 'cousin_maternal_male_unspecified'],
  [['mother', 'brotherAgeUnknown', 'daughter'], 'cousin_maternal_female_unspecified'],
  [['mother', 'olderBrother', 'son'], 'cousin_maternal_male_unspecified'],
  [['mother', 'youngerBrother', 'son'], 'cousin_maternal_male_unspecified'],
  [['mother', 'olderBrother', 'daughter'], 'cousin_maternal_female_unspecified'],
  [['mother', 'youngerBrother', 'daughter'], 'cousin_maternal_female_unspecified'],
  [['mother', 'olderSister', 'son'], 'cousin_maternal_auntline_male_unspecified'],
  [['mother', 'youngerSister', 'son'], 'cousin_maternal_auntline_male_unspecified'],
  [['mother', 'olderSister', 'daughter'], 'cousin_maternal_auntline_female_unspecified'],
  [['mother', 'youngerSister', 'daughter'], 'cousin_maternal_auntline_female_unspecified'],
  [['husband', 'mother'], selectorToGenericConceptId('h,m')],
  [['wife', 'father'], selectorToGenericConceptId('w,f')],
  [['olderBrother'], selectorToGenericConceptId('ob')],
  [['youngerSister'], selectorToGenericConceptId('ls')],
  [['daughter', 'son'], selectorToGenericConceptId('d,s')]
];

checks.forEach(([ids, expected]) => testConcept(ids, expected));
assert.ok(checks.length >= 40, 'Need at least 40 representative chain checks');

// Missing-facts behavior for underspecified chain
const missing = testConcept(['father', 'brotherAgeUnknown'], 'paternal_uncle_unspecified');
assert.ok(missing.missingFacts.some((f) => f.includes('brotherAgeOrder')));

const cousinMissing = testConcept(['father', 'olderBrother', 'son'], 'cousin_paternal_male_unspecified');
assert.ok(cousinMissing.missingFacts.includes('cousinAgeRelative'));

// Reverse-mode deterministic support
const reverseUnknown = testResolved(['father', 'olderBrother'], true, -1);
assert.ok(reverseUnknown.reverseSelectors.length >= 1);
assert.ok(reverseUnknown.conceptId.startsWith('reverse_'));

const reverseMale = testResolved(['father', 'olderBrother'], true, 1);
assert.ok(reverseMale.reverseSelectors.length >= 1);

const reverseFemale = testResolved(['father', 'olderBrother'], true, 0);
assert.ok(reverseFemale.reverseSelectors.length >= 1);

// Term selection by dialect
const cantonesePick = selectTerms({
  conceptId: 'paternal_aunt_elder',
  dialectId: 'cantonese_sg',
  dialectData: dialectJson,
  baselineTerms: ['\u5927\u59d1', '\u59d1\u5988', '\u59d1\u59d1'],
  customOverrides: {},
  requiresResolution: false
});
assert.strictEqual(cantonesePick.recommended, '\u59d1\u5988');
assert.ok(cantonesePick.alternatives.includes('\u5927\u59d1'));

// Custom override precedence
const customPick = selectTerms({
  conceptId: 'paternal_aunt_elder',
  dialectId: 'custom',
  dialectData: dialectJson,
  baselineTerms: ['\u5927\u59d1', '\u59d1\u5988', '\u59d1\u59d1'],
  customOverrides: { paternal_aunt_elder: '\u59d1\u59d0' },
  requiresResolution: false
});
assert.strictEqual(customPick.recommended, '\u59d1\u59d0');

// Fallback when concept mapping is missing
const unknownConcept = selectTerms({
  conceptId: 'selector_nonexistent',
  dialectId: 'teochew_sg',
  dialectData: dialectJson,
  baselineTerms: ['\u4f2f\u7236', '\u4f2f\u4f2f'],
  customOverrides: {},
  requiresResolution: false
});
assert.strictEqual(unknownConcept.recommended, '\u4f2f\u7236');
assert.ok(unknownConcept.alternatives.includes('\u4f2f\u4f2f'));

// No single recommendation when unresolved facts remain
const unresolvedSelection = selectTerms({
  conceptId: 'paternal_uncle_unspecified',
  dialectId: 'mandarin_standard',
  dialectData: dialectJson,
  baselineTerms: ['\u4f2f\u7236', '\u53d4\u53d4'],
  customOverrides: {},
  requiresResolution: true
});
assert.strictEqual(unresolvedSelection.recommended, null);
assert.ok(unresolvedSelection.alternatives.includes('\u4f2f\u7236'));
assert.ok(unresolvedSelection.alternatives.includes('\u53d4\u53d4'));

// Always include Standard Mandarin in list when recommendation differs
const hokkienPick = selectTerms({
  conceptId: 'paternal_aunt_elder',
  dialectId: 'hokkien_sg',
  dialectData: dialectJson,
  baselineTerms: ['\u5927\u59d1', '\u59d1\u5988'],
  customOverrides: {},
  requiresResolution: false
});
assert.strictEqual(hokkienPick.recommended, '\u963f\u59d1');
assert.ok(hokkienPick.alternatives.includes('\u5927\u59d1'));

console.log('All deterministic dialect-preference tests passed.');
