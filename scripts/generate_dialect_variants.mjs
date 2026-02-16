import fs from 'fs';
import relationship from '../relationship.min.mjs';
import { getCoreSelectorMap, selectorToEnglishGloss, selectorToGenericConceptId } from '../kinship_core.mjs';

const TODAY = '2026-02-16';

const DIALECTS = [
  { id: 'mandarin_standard', label: 'Standard Mandarin' },
  { id: 'cantonese_sg', label: 'Cantonese-style (SG)' },
  { id: 'hokkien_sg', label: 'Hokkien-style (SG / Minnan)' },
  { id: 'teochew_sg', label: 'Teochew-style (SG / Chaoshan)' },
  { id: 'hakka_sg', label: 'Hakka-style (SG)' },
  { id: 'hainanese_sg', label: 'Hainanese-style (SG)' },
  { id: 'custom', label: 'Custom' }
];

const SOURCE_LIBRARY = {
  relationship_js: {
    url: 'https://github.com/mumuy/relationship',
    title: 'mumuy/relationship',
    accessed: TODAY,
    notes: 'Deterministic baseline Mandarin kinship outputs and aliases.'
  },
  cuhk_cantonese_main: {
    url: 'https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/',
    title: '???????? (CUHK)',
    accessed: TODAY,
    notes: 'Authoritative Cantonese lexicon and pronunciation reference.'
  },
  cuhk_char_gu: {
    url: 'https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/search.php?q=%A9%68',
    title: '???????? - ?',
    accessed: TODAY,
    notes: 'Contains the term ?? in Cantonese lexical examples.'
  },
  cuhk_char_bo: {
    url: 'https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/search.php?q=%A7%42',
    title: '???????? - ?',
    accessed: TODAY,
    notes: 'Contains ?? and related paternal-uncle lexical usage.'
  },
  cuhk_char_shuk: {
    url: 'https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/search.php?q=%A8%FB',
    title: '???????? - ?',
    accessed: TODAY,
    notes: 'Contains ?? and related younger paternal-uncle usage.'
  },
  cuhk_char_yi: {
    url: 'https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/search.php?q=%AB%BC',
    title: '???????? - ?',
    accessed: TODAY,
    notes: 'Contains ?? lexical usage.'
  },
  cuhk_char_jiu: {
    url: 'https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/search.php?q=%B8%A4',
    title: '???????? - ?',
    accessed: TODAY,
    notes: 'Contains ?? lexical usage.'
  },
  sutian_home: {
    url: 'https://sutian.moe.edu.tw/',
    title: '????????????',
    accessed: TODAY,
    notes: 'Authoritative Minnan (Taiwan Hokkien) lexical reference used as SG Hokkien proxy where needed.'
  },
  sutian_agu: {
    url: 'https://sutian.moe.edu.tw/zh-hant/su/4556/',
    title: '???????????? - ??',
    accessed: TODAY,
    notes: 'Defines ?? as father\'s sisters / paternal aunt address.'
  },
  sutian_ajiu: {
    url: 'https://sutian.moe.edu.tw/zh-hant/su/4626/',
    title: '???????????? - ??',
    accessed: TODAY,
    notes: 'Defines ?? as maternal uncle address.'
  },
  sutian_ayi: {
    url: 'https://sutian.moe.edu.tw/zh-hant/su/4567/',
    title: '???????????? - ??',
    accessed: TODAY,
    notes: 'Defines ?? as maternal-aunt style address.'
  },
  sutian_agong: {
    url: 'https://sutian.moe.edu.tw/zh-hant/su/4508/',
    title: '???????????? - ??',
    accessed: TODAY,
    notes: 'Grandfather address in Minnan lexical usage.'
  },
  sutian_ama: {
    url: 'https://sutian.moe.edu.tw/zh-hant/su/4621/',
    title: '???????????? - ??',
    accessed: TODAY,
    notes: 'Grandmother address in Minnan lexical usage.'
  },
  hakka_home: {
    url: 'https://hakkadict.moe.edu.tw/',
    title: '?????????',
    accessed: TODAY,
    notes: 'Authoritative Hakka lexical reference.'
  },
  hakka_solr: {
    url: 'https://hakkadict.moe.edu.tw/solr_search/',
    title: '????????? - ????',
    accessed: TODAY,
    notes: 'Public search endpoint returns ?? lexical excerpts in Hakka corpora.'
  },
  sccc_dialects: {
    url: 'https://www.singaporeccc.org.sg/our-work/research-public-education/',
    title: 'Singapore Chinese Cultural Centre - Research & Public Education',
    accessed: TODAY,
    notes: 'Singapore Chinese dialect-group context; used for SG dialect scope and unverified-gap annotation.'
  },
  languages_of_singapore: {
    url: 'https://en.wikipedia.org/wiki/Languages_of_Singapore',
    title: 'Languages of Singapore',
    accessed: TODAY,
    notes: 'Context source for language and dialect-group overview in Singapore.'
  }
};

function source(id, notesOverride = null) {
  const base = SOURCE_LIBRARY[id];
  if (!base) throw new Error(`Unknown source id: ${id}`);
  if (!notesOverride) return { ...base };
  return { ...base, notes: notesOverride };
}

function dedupe(list) {
  return [...new Set((list || []).filter(Boolean))];
}

function mkVariant(preferred, alternatives, confidence, sources) {
  return {
    preferred: preferred || '',
    alternatives: dedupe(alternatives || []).filter((x) => x !== preferred),
    confidence,
    sources
  };
}

function fallbackVariants(canonicalMandarin) {
  const preferred = canonicalMandarin[0] || '';
  const alternatives = canonicalMandarin.slice(1);
  return {
    mandarin_standard: mkVariant(preferred, alternatives, 'medium', [source('relationship_js')]),
    cantonese_sg: mkVariant(preferred, alternatives, 'low', [
      source('cuhk_cantonese_main', 'No concept-specific verified Cantonese variant found; fallback to Standard Mandarin.'),
      source('relationship_js')
    ]),
    hokkien_sg: mkVariant(preferred, alternatives, 'low', [
      source('sutian_home', 'No concept-specific verified Hokkien variant found; fallback to Standard Mandarin.'),
      source('relationship_js')
    ]),
    teochew_sg: mkVariant(preferred, alternatives, 'low', [
      source('sccc_dialects', 'Teochew concept-specific term is unverified for this relation; fallback to Standard Mandarin.'),
      source('languages_of_singapore')
    ]),
    hakka_sg: mkVariant(preferred, alternatives, 'low', [
      source('hakka_home', 'No concept-specific verified Hakka variant found; fallback to Standard Mandarin.'),
      source('relationship_js')
    ]),
    hainanese_sg: mkVariant(preferred, alternatives, 'low', [
      source('sccc_dialects', 'Hainanese concept-specific term is unverified for this relation; fallback to Standard Mandarin.'),
      source('languages_of_singapore')
    ]),
    custom: mkVariant(preferred, alternatives, 'low', [
      source('relationship_js', 'Custom mode is user-pinned; default fallback shown before pinning.')
    ])
  };
}

const CURATED = {
  paternal_aunt_elder: {
    gloss_en: "father's older sister",
    requires: ['fatherSide', 'olderThanParent', 'relativeGenderFemale'],
    canonical_mandarin: ['??', '??', '??'],
    variants: {
      mandarin_standard: mkVariant('??', ['??', '??'], 'medium', [source('relationship_js')]),
      cantonese_sg: mkVariant('??', ['??', '??', '??'], 'high', [source('cuhk_char_gu'), source('cuhk_cantonese_main')]),
      hokkien_sg: mkVariant('??', ['??', '??'], 'medium', [source('sutian_agu')]),
      teochew_sg: mkVariant('??', ['??', '??'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('??', ['??', '??'], 'medium', [source('hakka_solr')]),
      hainanese_sg: mkVariant('??', ['??', '??'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('??', ['??', '??'], 'low', [source('relationship_js')])
    }
  },
  paternal_aunt_younger: {
    gloss_en: "father's younger sister",
    requires: ['fatherSide', 'youngerThanParent', 'relativeGenderFemale'],
    canonical_mandarin: ['??', '??', '??'],
    variants: {
      mandarin_standard: mkVariant('??', ['??', '??'], 'medium', [source('relationship_js')]),
      cantonese_sg: mkVariant('??', ['??', '??', '??'], 'medium', [source('cuhk_char_gu')]),
      hokkien_sg: mkVariant('??', ['??', '??'], 'medium', [source('sutian_agu')]),
      teochew_sg: mkVariant('??', ['??', '??'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('??', ['??', '??'], 'medium', [source('hakka_solr')]),
      hainanese_sg: mkVariant('??', ['??', '??'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('??', ['??', '??'], 'low', [source('relationship_js')])
    }
  },
  paternal_uncle_elder: {
    gloss_en: "father's older brother",
    requires: ['fatherSide', 'olderThanParent', 'relativeGenderMale'],
    canonical_mandarin: ['??', '??', '??'],
    variants: {
      mandarin_standard: mkVariant('??', ['??', '??'], 'high', [source('relationship_js')]),
      cantonese_sg: mkVariant('??', ['??', '??', '??'], 'high', [source('cuhk_char_bo')]),
      hokkien_sg: mkVariant('??', ['??', '??'], 'medium', [source('sutian_home')]),
      teochew_sg: mkVariant('??', ['??', '??'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('??', ['??', '??'], 'low', [source('hakka_home')]),
      hainanese_sg: mkVariant('??', ['??', '??'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('??', ['??', '??'], 'low', [source('relationship_js')])
    }
  },
  paternal_uncle_younger: {
    gloss_en: "father's younger brother",
    requires: ['fatherSide', 'youngerThanParent', 'relativeGenderMale'],
    canonical_mandarin: ['??', '??', '??'],
    variants: {
      mandarin_standard: mkVariant('??', ['??', '??'], 'high', [source('relationship_js')]),
      cantonese_sg: mkVariant('??', ['??', '??', '??'], 'high', [source('cuhk_char_shuk')]),
      hokkien_sg: mkVariant('??', ['??', '??'], 'medium', [source('sutian_home')]),
      teochew_sg: mkVariant('??', ['??', '??'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('??', ['??', '??'], 'low', [source('hakka_home')]),
      hainanese_sg: mkVariant('??', ['??', '??'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('??', ['??', '??'], 'low', [source('relationship_js')])
    }
  },
  maternal_uncle: {
    gloss_en: "mother's brother",
    requires: ['motherSide', 'relativeGenderMale'],
    canonical_mandarin: ['??', '??'],
    variants: {
      mandarin_standard: mkVariant('??', ['??'], 'high', [source('relationship_js')]),
      cantonese_sg: mkVariant('??', ['??'], 'high', [source('cuhk_char_jiu')]),
      hokkien_sg: mkVariant('??', ['??', '??'], 'medium', [source('sutian_ajiu')]),
      teochew_sg: mkVariant('??', ['??', '??'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('??', ['??', '??'], 'low', [source('hakka_solr')]),
      hainanese_sg: mkVariant('??', ['??'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('??', ['??'], 'low', [source('relationship_js')])
    }
  },
  maternal_aunt: {
    gloss_en: "mother's sister",
    requires: ['motherSide', 'relativeGenderFemale'],
    canonical_mandarin: ['??', '??'],
    variants: {
      mandarin_standard: mkVariant('??', ['??'], 'high', [source('relationship_js')]),
      cantonese_sg: mkVariant('??', ['??'], 'high', [source('cuhk_char_yi')]),
      hokkien_sg: mkVariant('??', ['??'], 'medium', [source('sutian_ayi')]),
      teochew_sg: mkVariant('??', ['??'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('??', ['??'], 'low', [source('hakka_home')]),
      hainanese_sg: mkVariant('??', ['??'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('??', ['??'], 'low', [source('relationship_js')])
    }
  },
  paternal_grandfather: {
    gloss_en: "father's father",
    requires: ['fatherSide', 'generationGrandparent', 'relativeGenderMale'],
    canonical_mandarin: ['??'],
    variants: {
      mandarin_standard: mkVariant('??', [], 'high', [source('relationship_js')]),
      cantonese_sg: mkVariant('??', ['??'], 'medium', [source('cuhk_cantonese_main')]),
      hokkien_sg: mkVariant('??', ['??'], 'medium', [source('sutian_agong')]),
      teochew_sg: mkVariant('??', ['??'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('??', ['??'], 'low', [source('hakka_home')]),
      hainanese_sg: mkVariant('??', ['??'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('??', [], 'low', [source('relationship_js')])
    }
  },
  paternal_grandmother: {
    gloss_en: "father's mother",
    requires: ['fatherSide', 'generationGrandparent', 'relativeGenderFemale'],
    canonical_mandarin: ['??'],
    variants: {
      mandarin_standard: mkVariant('??', [], 'high', [source('relationship_js')]),
      cantonese_sg: mkVariant('??', ['??'], 'medium', [source('cuhk_cantonese_main')]),
      hokkien_sg: mkVariant('??', ['??'], 'medium', [source('sutian_ama')]),
      teochew_sg: mkVariant('??', ['??'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('??', ['??'], 'low', [source('hakka_home')]),
      hainanese_sg: mkVariant('??', ['??'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('??', [], 'low', [source('relationship_js')])
    }
  },
  maternal_grandfather: {
    gloss_en: "mother's father",
    requires: ['motherSide', 'generationGrandparent', 'relativeGenderMale'],
    canonical_mandarin: ['??'],
    variants: {
      mandarin_standard: mkVariant('??', [], 'high', [source('relationship_js')]),
      cantonese_sg: mkVariant('??', [], 'medium', [source('cuhk_cantonese_main')]),
      hokkien_sg: mkVariant('??', ['??'], 'medium', [source('sutian_agong')]),
      teochew_sg: mkVariant('??', ['??'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('??', ['??'], 'low', [source('hakka_home')]),
      hainanese_sg: mkVariant('??', ['??'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('??', [], 'low', [source('relationship_js')])
    }
  },
  maternal_grandmother: {
    gloss_en: "mother's mother",
    requires: ['motherSide', 'generationGrandparent', 'relativeGenderFemale'],
    canonical_mandarin: ['??'],
    variants: {
      mandarin_standard: mkVariant('??', [], 'high', [source('relationship_js')]),
      cantonese_sg: mkVariant('??', [], 'medium', [source('cuhk_cantonese_main')]),
      hokkien_sg: mkVariant('??', ['??', '??'], 'medium', [source('sutian_ama')]),
      teochew_sg: mkVariant('??', ['??'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('??', ['??'], 'low', [source('hakka_home')]),
      hainanese_sg: mkVariant('??', ['??'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('??', [], 'low', [source('relationship_js')])
    }
  },
  paternal_uncle_elder_spouse: {
    gloss_en: "father's older brother's spouse",
    requires: ['fatherSide', 'olderThanParent'],
    canonical_mandarin: ['??'],
    variants: fallbackVariants(['??'])
  },
  paternal_uncle_younger_spouse: {
    gloss_en: "father's younger brother's spouse",
    requires: ['fatherSide', 'youngerThanParent'],
    canonical_mandarin: ['??'],
    variants: fallbackVariants(['??'])
  },
  paternal_aunt_elder_spouse: {
    gloss_en: "father's older sister's spouse",
    requires: ['fatherSide', 'olderThanParent'],
    canonical_mandarin: ['???', '??'],
    variants: fallbackVariants(['???', '??'])
  },
  paternal_aunt_younger_spouse: {
    gloss_en: "father's younger sister's spouse",
    requires: ['fatherSide', 'youngerThanParent'],
    canonical_mandarin: ['???', '??'],
    variants: fallbackVariants(['???', '??'])
  },
  maternal_uncle_spouse: {
    gloss_en: "mother's brother's spouse",
    requires: ['motherSide'],
    canonical_mandarin: ['??'],
    variants: fallbackVariants(['??'])
  },
  maternal_aunt_spouse: {
    gloss_en: "mother's sister's spouse",
    requires: ['motherSide'],
    canonical_mandarin: ['??'],
    variants: fallbackVariants(['??'])
  },
  cousin_paternal_male_elder: {
    gloss_en: 'paternal cousin (male, elder) [?]',
    requires: ['fatherSide', 'cousinMale', 'cousinOlderThanUser'],
    canonical_mandarin: ['??'],
    variants: fallbackVariants(['??'])
  },
  cousin_paternal_male_younger: {
    gloss_en: 'paternal cousin (male, younger) [?]',
    requires: ['fatherSide', 'cousinMale', 'cousinYoungerThanUser'],
    canonical_mandarin: ['??'],
    variants: fallbackVariants(['??'])
  },
  cousin_paternal_female_elder: {
    gloss_en: 'paternal cousin (female, elder) [?]',
    requires: ['fatherSide', 'cousinFemale', 'cousinOlderThanUser'],
    canonical_mandarin: ['??'],
    variants: fallbackVariants(['??'])
  },
  cousin_paternal_female_younger: {
    gloss_en: 'paternal cousin (female, younger) [?]',
    requires: ['fatherSide', 'cousinFemale', 'cousinYoungerThanUser'],
    canonical_mandarin: ['??'],
    variants: fallbackVariants(['??'])
  },
  cousin_maternal_male_elder: {
    gloss_en: 'maternal cousin (male, elder) [?]',
    requires: ['motherSide', 'cousinMale', 'cousinOlderThanUser'],
    canonical_mandarin: ['???'],
    variants: fallbackVariants(['???'])
  },
  cousin_maternal_male_younger: {
    gloss_en: 'maternal cousin (male, younger) [?]',
    requires: ['motherSide', 'cousinMale', 'cousinYoungerThanUser'],
    canonical_mandarin: ['???'],
    variants: fallbackVariants(['???'])
  },
  cousin_maternal_female_elder: {
    gloss_en: 'maternal cousin (female, elder) [?]',
    requires: ['motherSide', 'cousinFemale', 'cousinOlderThanUser'],
    canonical_mandarin: ['???'],
    variants: fallbackVariants(['???'])
  },
  cousin_maternal_female_younger: {
    gloss_en: 'maternal cousin (female, younger) [?]',
    requires: ['motherSide', 'cousinFemale', 'cousinYoungerThanUser'],
    canonical_mandarin: ['???'],
    variants: fallbackVariants(['???'])
  },
  cousin_auntline_male_elder: {
    gloss_en: 'paternal-aunt-line cousin (male, elder) [?]',
    requires: ['fatherSide', 'cousinMale', 'cousinOlderThanUser'],
    canonical_mandarin: ['???'],
    variants: fallbackVariants(['???'])
  },
  cousin_auntline_male_younger: {
    gloss_en: 'paternal-aunt-line cousin (male, younger) [?]',
    requires: ['fatherSide', 'cousinMale', 'cousinYoungerThanUser'],
    canonical_mandarin: ['???'],
    variants: fallbackVariants(['???'])
  },
  cousin_auntline_female_elder: {
    gloss_en: 'paternal-aunt-line cousin (female, elder) [?]',
    requires: ['fatherSide', 'cousinFemale', 'cousinOlderThanUser'],
    canonical_mandarin: ['???'],
    variants: fallbackVariants(['???'])
  },
  cousin_auntline_female_younger: {
    gloss_en: 'paternal-aunt-line cousin (female, younger) [?]',
    requires: ['fatherSide', 'cousinFemale', 'cousinYoungerThanUser'],
    canonical_mandarin: ['???'],
    variants: fallbackVariants(['???'])
  },
  ranking_prefix_usage_uncles: {
    gloss_en: 'ranking prefix usage for paternal uncles (?/?/?/?)',
    requires: ['fatherSide', 'siblingOrderIndex'],
    canonical_mandarin: ['??', '??', '??', '??', '??'],
    variants: fallbackVariants(['??', '??', '??', '??', '??'])
  },
  ranking_prefix_usage_aunts: {
    gloss_en: 'ranking prefix usage for paternal aunts (?/?/?/?)',
    requires: ['fatherSide', 'siblingOrderIndex'],
    canonical_mandarin: ['??', '??', '??', '??'],
    variants: fallbackVariants(['??', '??', '??', '??'])
  },
  a_prefix_usage_general: {
    gloss_en: 'common ?- prefix usage in family address terms',
    requires: ['dialectFamilyUsage'],
    canonical_mandarin: ['??', '??', '??', '??', '??'],
    variants: fallbackVariants(['??', '??', '??', '??', '??'])
  }
};

const CURATED_OVERRIDES = {
  paternal_aunt_elder: {
    gloss_en: "father's older sister",
    requires: ['fatherSide', 'olderThanParent', 'relativeGenderFemale'],
    canonical_mandarin: ['\u5927\u59d1', '\u59d1\u5988', '\u59d1\u59d1'],
    variants: {
      mandarin_standard: mkVariant('\u5927\u59d1', ['\u59d1\u5988', '\u59d1\u59d1'], 'medium', [source('relationship_js')]),
      cantonese_sg: mkVariant('\u59d1\u5988', ['\u59d1\u59d0', '\u5927\u59d1', '\u59d1\u59d1'], 'high', [source('cuhk_char_gu')]),
      hokkien_sg: mkVariant('\u963f\u59d1', ['\u59d1\u5988', '\u59d1\u59d1'], 'medium', [source('sutian_agu')]),
      teochew_sg: mkVariant('\u963f\u59d1', ['\u59d1\u5988', '\u59d1\u59d1'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('\u963f\u59d1', ['\u59d1\u5988', '\u59d1\u59d1'], 'medium', [source('hakka_solr')]),
      hainanese_sg: mkVariant('\u59d1\u5988', ['\u5927\u59d1', '\u59d1\u59d1'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('\u5927\u59d1', ['\u59d1\u5988', '\u59d1\u59d1'], 'low', [source('relationship_js')])
    }
  },
  paternal_aunt_younger: {
    gloss_en: "father's younger sister",
    requires: ['fatherSide', 'youngerThanParent', 'relativeGenderFemale'],
    canonical_mandarin: ['\u5c0f\u59d1', '\u59d1\u5988', '\u59d1\u59d1'],
    variants: {
      mandarin_standard: mkVariant('\u5c0f\u59d1', ['\u59d1\u5988', '\u59d1\u59d1'], 'medium', [source('relationship_js')]),
      cantonese_sg: mkVariant('\u59d1\u59d0', ['\u59d1\u5988', '\u5c0f\u59d1', '\u59d1\u59d1'], 'medium', [source('cuhk_char_gu')]),
      hokkien_sg: mkVariant('\u963f\u59d1', ['\u59d1\u5988', '\u59d1\u59d1'], 'medium', [source('sutian_agu')]),
      teochew_sg: mkVariant('\u963f\u59d1', ['\u59d1\u5988', '\u59d1\u59d1'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('\u963f\u59d1', ['\u59d1\u5988', '\u59d1\u59d1'], 'medium', [source('hakka_solr')]),
      hainanese_sg: mkVariant('\u59d1\u5988', ['\u5c0f\u59d1', '\u59d1\u59d1'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('\u5c0f\u59d1', ['\u59d1\u5988', '\u59d1\u59d1'], 'low', [source('relationship_js')])
    }
  },
  paternal_uncle_elder: {
    gloss_en: "father's older brother",
    requires: ['fatherSide', 'olderThanParent', 'relativeGenderMale'],
    canonical_mandarin: ['\u4f2f\u7236', '\u4f2f\u4f2f', '\u5927\u4f2f'],
    variants: {
      mandarin_standard: mkVariant('\u4f2f\u7236', ['\u4f2f\u4f2f', '\u5927\u4f2f'], 'high', [source('relationship_js')]),
      cantonese_sg: mkVariant('\u4f2f\u7236', ['\u4f2f\u4f2f', '\u963f\u4f2f'], 'high', [source('cuhk_char_bo')]),
      hokkien_sg: mkVariant('\u963f\u4f2f', ['\u4f2f\u7236', '\u4f2f\u4f2f'], 'medium', [source('sutian_home')]),
      teochew_sg: mkVariant('\u963f\u4f2f', ['\u4f2f\u7236', '\u4f2f\u4f2f'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('\u4f2f\u7236', ['\u963f\u4f2f', '\u4f2f\u4f2f'], 'low', [source('hakka_home')]),
      hainanese_sg: mkVariant('\u4f2f\u7236', ['\u4f2f\u4f2f'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('\u4f2f\u7236', ['\u4f2f\u4f2f', '\u5927\u4f2f'], 'low', [source('relationship_js')])
    }
  },
  paternal_uncle_younger: {
    gloss_en: "father's younger brother",
    requires: ['fatherSide', 'youngerThanParent', 'relativeGenderMale'],
    canonical_mandarin: ['\u53d4\u53d4', '\u53d4\u7236', '\u5c0f\u53d4'],
    variants: {
      mandarin_standard: mkVariant('\u53d4\u53d4', ['\u53d4\u7236', '\u5c0f\u53d4'], 'high', [source('relationship_js')]),
      cantonese_sg: mkVariant('\u53d4\u7236', ['\u53d4\u53d4', '\u963f\u53d4'], 'high', [source('cuhk_char_shuk')]),
      hokkien_sg: mkVariant('\u963f\u53d4', ['\u53d4\u53d4', '\u53d4\u7236'], 'medium', [source('sutian_home')]),
      teochew_sg: mkVariant('\u963f\u53d4', ['\u53d4\u53d4', '\u53d4\u7236'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('\u53d4\u53d4', ['\u963f\u53d4', '\u53d4\u7236'], 'low', [source('hakka_home')]),
      hainanese_sg: mkVariant('\u53d4\u53d4', ['\u53d4\u7236'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('\u53d4\u53d4', ['\u53d4\u7236', '\u5c0f\u53d4'], 'low', [source('relationship_js')])
    }
  },
  maternal_uncle: {
    gloss_en: "mother's brother",
    requires: ['motherSide', 'relativeGenderMale'],
    canonical_mandarin: ['\u8205\u8205', '\u8205\u7236'],
    variants: {
      mandarin_standard: mkVariant('\u8205\u8205', ['\u8205\u7236'], 'high', [source('relationship_js')]),
      cantonese_sg: mkVariant('\u8205\u7236', ['\u8205\u8205'], 'high', [source('cuhk_char_jiu')]),
      hokkien_sg: mkVariant('\u963f\u8205', ['\u8205\u8205', '\u8205\u7236'], 'medium', [source('sutian_ajiu')]),
      teochew_sg: mkVariant('\u963f\u8205', ['\u8205\u8205', '\u8205\u7236'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('\u963f\u8205', ['\u8205\u8205', '\u8205\u7236'], 'low', [source('hakka_solr')]),
      hainanese_sg: mkVariant('\u8205\u8205', ['\u8205\u7236'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('\u8205\u8205', ['\u8205\u7236'], 'low', [source('relationship_js')])
    }
  },
  maternal_aunt: {
    gloss_en: "mother's sister",
    requires: ['motherSide', 'relativeGenderFemale'],
    canonical_mandarin: ['\u59e8\u5988', '\u963f\u59e8'],
    variants: {
      mandarin_standard: mkVariant('\u59e8\u5988', ['\u963f\u59e8'], 'high', [source('relationship_js')]),
      cantonese_sg: mkVariant('\u59e8\u5988', ['\u963f\u59e8'], 'high', [source('cuhk_char_yi')]),
      hokkien_sg: mkVariant('\u963f\u59e8', ['\u59e8\u5988'], 'medium', [source('sutian_ayi')]),
      teochew_sg: mkVariant('\u963f\u59e8', ['\u59e8\u5988'], 'low', [source('sccc_dialects')]),
      hakka_sg: mkVariant('\u963f\u59e8', ['\u59e8\u5988'], 'low', [source('hakka_home')]),
      hainanese_sg: mkVariant('\u59e8\u5988', ['\u963f\u59e8'], 'low', [source('sccc_dialects')]),
      custom: mkVariant('\u59e8\u5988', ['\u963f\u59e8'], 'low', [source('relationship_js')])
    }
  },
  paternal_uncle_elder_spouse: { gloss_en: "father's older brother's spouse", requires: ['fatherSide', 'olderThanParent'], canonical_mandarin: ['\u4f2f\u6bcd'], variants: fallbackVariants(['\u4f2f\u6bcd']) },
  paternal_uncle_younger_spouse: { gloss_en: "father's younger brother's spouse", requires: ['fatherSide', 'youngerThanParent'], canonical_mandarin: ['\u5a76\u5a76'], variants: fallbackVariants(['\u5a76\u5a76']) },
  paternal_aunt_elder_spouse: { gloss_en: "father's older sister's spouse", requires: ['fatherSide', 'olderThanParent'], canonical_mandarin: ['\u5927\u59d1\u4e08', '\u59d1\u4e08'], variants: fallbackVariants(['\u5927\u59d1\u4e08', '\u59d1\u4e08']) },
  paternal_aunt_younger_spouse: { gloss_en: "father's younger sister's spouse", requires: ['fatherSide', 'youngerThanParent'], canonical_mandarin: ['\u5c0f\u59d1\u4e08', '\u59d1\u4e08'], variants: fallbackVariants(['\u5c0f\u59d1\u4e08', '\u59d1\u4e08']) },
  maternal_uncle_spouse: { gloss_en: "mother's brother's spouse", requires: ['motherSide'], canonical_mandarin: ['\u8205\u5988'], variants: fallbackVariants(['\u8205\u5988']) },
  maternal_aunt_spouse: { gloss_en: "mother's sister's spouse", requires: ['motherSide'], canonical_mandarin: ['\u59e8\u4e08'], variants: fallbackVariants(['\u59e8\u4e08']) },
  cousin_paternal_male_elder: { gloss_en: 'paternal cousin (male, elder) [\u5802]', requires: ['fatherSide', 'cousinMale', 'cousinOlderThanUser'], canonical_mandarin: ['\u5802\u54e5'], variants: fallbackVariants(['\u5802\u54e5']) },
  cousin_paternal_male_younger: { gloss_en: 'paternal cousin (male, younger) [\u5802]', requires: ['fatherSide', 'cousinMale', 'cousinYoungerThanUser'], canonical_mandarin: ['\u5802\u5f1f'], variants: fallbackVariants(['\u5802\u5f1f']) },
  cousin_paternal_female_elder: { gloss_en: 'paternal cousin (female, elder) [\u5802]', requires: ['fatherSide', 'cousinFemale', 'cousinOlderThanUser'], canonical_mandarin: ['\u5802\u59d0'], variants: fallbackVariants(['\u5802\u59d0']) },
  cousin_paternal_female_younger: { gloss_en: 'paternal cousin (female, younger) [\u5802]', requires: ['fatherSide', 'cousinFemale', 'cousinYoungerThanUser'], canonical_mandarin: ['\u5802\u59b9'], variants: fallbackVariants(['\u5802\u59b9']) },
  cousin_maternal_male_elder: { gloss_en: 'maternal cousin (male, elder) [\u8868]', requires: ['motherSide', 'cousinMale', 'cousinOlderThanUser'], canonical_mandarin: ['\u8205\u8868\u54e5'], variants: fallbackVariants(['\u8205\u8868\u54e5']) },
  cousin_maternal_male_younger: { gloss_en: 'maternal cousin (male, younger) [\u8868]', requires: ['motherSide', 'cousinMale', 'cousinYoungerThanUser'], canonical_mandarin: ['\u8205\u8868\u5f1f'], variants: fallbackVariants(['\u8205\u8868\u5f1f']) },
  cousin_maternal_female_elder: { gloss_en: 'maternal cousin (female, elder) [\u8868]', requires: ['motherSide', 'cousinFemale', 'cousinOlderThanUser'], canonical_mandarin: ['\u8205\u8868\u59d0'], variants: fallbackVariants(['\u8205\u8868\u59d0']) },
  cousin_maternal_female_younger: { gloss_en: 'maternal cousin (female, younger) [\u8868]', requires: ['motherSide', 'cousinFemale', 'cousinYoungerThanUser'], canonical_mandarin: ['\u8205\u8868\u59b9'], variants: fallbackVariants(['\u8205\u8868\u59b9']) },
  cousin_auntline_male_elder: { gloss_en: 'paternal-aunt-line cousin (male, elder) [\u8868]', requires: ['fatherSide', 'cousinMale', 'cousinOlderThanUser'], canonical_mandarin: ['\u59d1\u8868\u54e5'], variants: fallbackVariants(['\u59d1\u8868\u54e5']) },
  cousin_auntline_male_younger: { gloss_en: 'paternal-aunt-line cousin (male, younger) [\u8868]', requires: ['fatherSide', 'cousinMale', 'cousinYoungerThanUser'], canonical_mandarin: ['\u59d1\u8868\u5f1f'], variants: fallbackVariants(['\u59d1\u8868\u5f1f']) },
  cousin_auntline_female_elder: { gloss_en: 'paternal-aunt-line cousin (female, elder) [\u8868]', requires: ['fatherSide', 'cousinFemale', 'cousinOlderThanUser'], canonical_mandarin: ['\u59d1\u8868\u59d0'], variants: fallbackVariants(['\u59d1\u8868\u59d0']) },
  cousin_auntline_female_younger: { gloss_en: 'paternal-aunt-line cousin (female, younger) [\u8868]', requires: ['fatherSide', 'cousinFemale', 'cousinYoungerThanUser'], canonical_mandarin: ['\u59d1\u8868\u59b9'], variants: fallbackVariants(['\u59d1\u8868\u59b9']) },
  paternal_grandfather: { gloss_en: "father's father", requires: ['fatherSide', 'generationGrandparent', 'relativeGenderMale'], canonical_mandarin: ['\u7237\u7237'], variants: fallbackVariants(['\u7237\u7237']) },
  paternal_grandmother: { gloss_en: "father's mother", requires: ['fatherSide', 'generationGrandparent', 'relativeGenderFemale'], canonical_mandarin: ['\u5976\u5976'], variants: fallbackVariants(['\u5976\u5976']) },
  maternal_grandfather: { gloss_en: "mother's father", requires: ['motherSide', 'generationGrandparent', 'relativeGenderMale'], canonical_mandarin: ['\u5916\u516c'], variants: fallbackVariants(['\u5916\u516c']) },
  maternal_grandmother: { gloss_en: "mother's mother", requires: ['motherSide', 'generationGrandparent', 'relativeGenderFemale'], canonical_mandarin: ['\u5916\u5a46'], variants: fallbackVariants(['\u5916\u5a46']) }
};

const SELECTOR_TO_CORE = {
  ...getCoreSelectorMap(),
  'f,os': 'paternal_aunt_elder',
  'f,ls': 'paternal_aunt_younger',
  'f,ob': 'paternal_uncle_elder',
  'f,lb': 'paternal_uncle_younger',
  'm,xb': 'maternal_uncle',
  'm,xs': 'maternal_aunt',
  'f,f': 'paternal_grandfather',
  'f,m': 'paternal_grandmother',
  'm,f': 'maternal_grandfather',
  'm,m': 'maternal_grandmother'
};

function concreteSelectors(maxLen = 6) {
  const keys = Object.keys(relationship.data || {});
  return keys
    .filter((key) => {
      if (!key) return false;
      if (key.includes('[') || key.includes('{') || key.includes('|') || key.includes('?') || key.includes('#') || key.includes('*')) return false;
      if (key === 'o') return false;
      const parts = key.split(',').filter(Boolean);
      if (!parts.length || parts.length > maxLen) return false;
      return parts.every((part) => /^[01fmhwsdoblx][a-z0-9&]*$/.test(part));
    })
    .sort();
}

function inferRequires(selector) {
  const requires = [];
  if (selector.includes('xb')) requires.push('olderYoungerMaleSibling');
  if (selector.includes('xs')) requires.push('olderYoungerFemaleSibling');
  if (selector.includes('&o') || selector.includes('&l')) requires.push('ageOrdering');
  if (selector.includes('f')) requires.push('branchMayBePaternal');
  if (selector.includes('m')) requires.push('branchMayBeMaternal');
  return dedupe(requires);
}

function generate() {
  const concepts = { ...CURATED, ...CURATED_OVERRIDES };
  const selectors = concreteSelectors(6);

  for (const selector of selectors) {
    const canonical = dedupe((relationship.data[selector] || []).slice(0, 4));
    if (!canonical.length) continue;

    const mappedId = SELECTOR_TO_CORE[selector];
    const conceptId = mappedId || selectorToGenericConceptId(selector, false);

    if (concepts[conceptId]) continue;

    concepts[conceptId] = {
      gloss_en: selectorToEnglishGloss(selector),
      requires: inferRequires(selector),
      canonical_mandarin: canonical,
      variants: fallbackVariants(canonical)
    };
  }

  const output = {
    meta: {
      version: '1.0.0',
      generatedAt: TODAY,
      notes: 'Dialect variants are household-specific; show alternatives and sources.'
    },
    dialects: DIALECTS,
    concepts
  };

  fs.writeFileSync('dialect_variants.json', `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Generated dialect_variants.json with ${Object.keys(concepts).length} concepts.`);
}

generate();
