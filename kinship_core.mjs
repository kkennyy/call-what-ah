export const DIALECT_STORAGE_KEY = 'cwah.settings.dialectPreference';
export const CUSTOM_OVERRIDES_STORAGE_KEY = 'cwah.customDialectOverrides.v1';

const CORE_SELECTOR_TO_CONCEPT_ID = {
  'f,ob': 'paternal_uncle_elder',
  'f,lb': 'paternal_uncle_younger',
  'f,xb': 'paternal_uncle_unspecified',
  'f,ob,w': 'paternal_uncle_elder_spouse',
  'f,lb,w': 'paternal_uncle_younger_spouse',
  'f,xb,w': 'paternal_uncle_spouse_unspecified',
  'f,os': 'paternal_aunt_elder',
  'f,ls': 'paternal_aunt_younger',
  'f,xs': 'paternal_aunt_unspecified',
  'f,os,h': 'paternal_aunt_elder_spouse',
  'f,ls,h': 'paternal_aunt_younger_spouse',
  'f,xs,h': 'paternal_aunt_spouse_unspecified',
  'm,xb': 'maternal_uncle',
  'm,xb,w': 'maternal_uncle_spouse',
  'm,xs': 'maternal_aunt',
  'm,xs,h': 'maternal_aunt_spouse',
  'f,f': 'paternal_grandfather',
  'f,m': 'paternal_grandmother',
  'm,f': 'maternal_grandfather',
  'm,m': 'maternal_grandmother',
  'f,xb,s&o': 'cousin_paternal_male_elder',
  'f,xb,s&l': 'cousin_paternal_male_younger',
  'f,xb,d&o': 'cousin_paternal_female_elder',
  'f,xb,d&l': 'cousin_paternal_female_younger',
  'f,ob,s&o': 'cousin_paternal_male_elder',
  'f,lb,s&o': 'cousin_paternal_male_elder',
  'f,ob,s&l': 'cousin_paternal_male_younger',
  'f,lb,s&l': 'cousin_paternal_male_younger',
  'f,ob,d&o': 'cousin_paternal_female_elder',
  'f,lb,d&o': 'cousin_paternal_female_elder',
  'f,ob,d&l': 'cousin_paternal_female_younger',
  'f,lb,d&l': 'cousin_paternal_female_younger',
  'f,ob,s': 'cousin_paternal_male_unspecified',
  'f,lb,s': 'cousin_paternal_male_unspecified',
  'f,xb,s': 'cousin_paternal_male_unspecified',
  'f,ob,d': 'cousin_paternal_female_unspecified',
  'f,lb,d': 'cousin_paternal_female_unspecified',
  'f,xb,d': 'cousin_paternal_female_unspecified',
  'f,xs,s&o': 'cousin_auntline_male_elder',
  'f,xs,s&l': 'cousin_auntline_male_younger',
  'f,xs,d&o': 'cousin_auntline_female_elder',
  'f,xs,d&l': 'cousin_auntline_female_younger',
  'f,os,s&o': 'cousin_auntline_male_elder',
  'f,ls,s&o': 'cousin_auntline_male_elder',
  'f,os,s&l': 'cousin_auntline_male_younger',
  'f,ls,s&l': 'cousin_auntline_male_younger',
  'f,os,d&o': 'cousin_auntline_female_elder',
  'f,ls,d&o': 'cousin_auntline_female_elder',
  'f,os,d&l': 'cousin_auntline_female_younger',
  'f,ls,d&l': 'cousin_auntline_female_younger',
  'f,os,s': 'cousin_auntline_male_unspecified',
  'f,ls,s': 'cousin_auntline_male_unspecified',
  'f,xs,s': 'cousin_auntline_male_unspecified',
  'f,os,d': 'cousin_auntline_female_unspecified',
  'f,ls,d': 'cousin_auntline_female_unspecified',
  'f,xs,d': 'cousin_auntline_female_unspecified',
  'm,xb,s&o': 'cousin_maternal_male_elder',
  'm,xb,s&l': 'cousin_maternal_male_younger',
  'm,xb,d&o': 'cousin_maternal_female_elder',
  'm,xb,d&l': 'cousin_maternal_female_younger',
  'm,ob,s&o': 'cousin_maternal_male_elder',
  'm,lb,s&o': 'cousin_maternal_male_elder',
  'm,ob,s&l': 'cousin_maternal_male_younger',
  'm,lb,s&l': 'cousin_maternal_male_younger',
  'm,ob,d&o': 'cousin_maternal_female_elder',
  'm,lb,d&o': 'cousin_maternal_female_elder',
  'm,ob,d&l': 'cousin_maternal_female_younger',
  'm,lb,d&l': 'cousin_maternal_female_younger',
  'm,ob,s': 'cousin_maternal_male_unspecified',
  'm,lb,s': 'cousin_maternal_male_unspecified',
  'm,xb,s': 'cousin_maternal_male_unspecified',
  'm,ob,d': 'cousin_maternal_female_unspecified',
  'm,lb,d': 'cousin_maternal_female_unspecified',
  'm,xb,d': 'cousin_maternal_female_unspecified',
  'm,xs,s&o': 'cousin_maternal_auntline_male_elder',
  'm,xs,s&l': 'cousin_maternal_auntline_male_younger',
  'm,xs,d&o': 'cousin_maternal_auntline_female_elder',
  'm,xs,d&l': 'cousin_maternal_auntline_female_younger',
  'm,os,s&o': 'cousin_maternal_auntline_male_elder',
  'm,ls,s&o': 'cousin_maternal_auntline_male_elder',
  'm,os,s&l': 'cousin_maternal_auntline_male_younger',
  'm,ls,s&l': 'cousin_maternal_auntline_male_younger',
  'm,os,d&o': 'cousin_maternal_auntline_female_elder',
  'm,ls,d&o': 'cousin_maternal_auntline_female_elder',
  'm,os,d&l': 'cousin_maternal_auntline_female_younger',
  'm,ls,d&l': 'cousin_maternal_auntline_female_younger',
  'm,os,s': 'cousin_maternal_auntline_male_unspecified',
  'm,ls,s': 'cousin_maternal_auntline_male_unspecified',
  'm,xs,s': 'cousin_maternal_auntline_male_unspecified',
  'm,os,d': 'cousin_maternal_auntline_female_unspecified',
  'm,ls,d': 'cousin_maternal_auntline_female_unspecified',
  'm,xs,d': 'cousin_maternal_auntline_female_unspecified'
};

const TOKEN_GLOSS = {
  f: 'father',
  m: 'mother',
  ob: 'older brother',
  lb: 'younger brother',
  xb: 'brother (age unknown)',
  os: 'older sister',
  ls: 'younger sister',
  xs: 'sister (age unknown)',
  s: 'son',
  d: 'daughter',
  h: 'husband',
  w: 'wife'
};

function dedupe(list) {
  return [...new Set((list || []).filter(Boolean))];
}

function sanitizeToken(token) {
  return token.replace(/&/g, '_').replace(/[^a-z0-9_]/g, '');
}

export function selectorToGenericConceptId(selector, reverse = false) {
  const base = `selector_${selector.split(',').map(sanitizeToken).join('__')}`;
  return reverse ? `reverse_${base}` : base;
}

export function selectorToEnglishGloss(selector) {
  if (!selector) return '';
  const parts = selector.split(',').filter(Boolean);
  return parts
    .map((raw) => {
      const base = raw.replace(/&[ol\d]+/g, '');
      const suffix = raw.includes('&o') ? ' (older)' : raw.includes('&l') ? ' (younger)' : '';
      return `${TOKEN_GLOSS[base] || base}${suffix}`;
    })
    .join("'s ");
}

function collectConceptTerms(concept) {
  const terms = new Set();
  if (!concept) return terms;

  (concept.canonical_mandarin || []).forEach((term) => {
    if (term) terms.add(term);
  });

  Object.values(concept.variants || {}).forEach((variant) => {
    if (!variant) return;
    if (variant.preferred) terms.add(variant.preferred);
    (variant.alternatives || []).forEach((term) => {
      if (term) terms.add(term);
    });
  });

  return terms;
}

function sortGlosses(glosses) {
  return [...new Set((glosses || []).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

export function buildTermGlossIndex(dialectData) {
  const index = new Map();
  const concepts = dialectData?.concepts || {};

  Object.values(concepts).forEach((concept) => {
    const gloss = typeof concept?.gloss_en === 'string' ? concept.gloss_en.trim() : '';
    if (!gloss) return;

    const terms = collectConceptTerms(concept);
    terms.forEach((term) => {
      const current = index.get(term) || [];
      current.push(gloss);
      index.set(term, current);
    });
  });

  index.forEach((glosses, term) => {
    index.set(term, sortGlosses(glosses));
  });

  return index;
}

export function resolveEnglishGlossForTerm(input) {
  const {
    term,
    concept,
    selector,
    reverseSelector,
    reverse = false,
    termGlossIndex
  } = input || {};

  if (!term) return null;

  const conceptGloss = typeof concept?.gloss_en === 'string' ? concept.gloss_en.trim() : '';
  if (conceptGloss) {
    const conceptTerms = collectConceptTerms(concept);
    if (conceptTerms.has(term)) return conceptGloss;
  }

  const indexedGlosses = termGlossIndex instanceof Map ? termGlossIndex.get(term) : null;
  const sortedGlosses = sortGlosses(Array.isArray(indexedGlosses) ? indexedGlosses : []);
  if (sortedGlosses.length === 1) return sortedGlosses[0];
  if (sortedGlosses.length > 1) return sortedGlosses.join(' / ');

  const fallbackSelector = reverse ? (reverseSelector || selector) : selector;
  const fallbackGloss = selectorToEnglishGloss(fallbackSelector);
  return fallbackGloss || null;
}

export function buildChineseText(chain, stepsById, numerals, connector) {
  return chain
    .map((entry) => {
      const step = stepsById[entry.stepId];
      if (!step) return '';
      if (entry.rank && step.rankable && numerals[String(entry.rank)]) {
        const numChar = numerals[String(entry.rank)];
        return `${numChar}${step.zhToken.charAt(0)}`;
      }
      return step.zhToken;
    })
    .join(connector);
}

export function buildSelector(chain, stepsById) {
  return chain
    .map((entry) => stepsById[entry.stepId]?.relationshipJsSelectorHint || '')
    .filter(Boolean)
    .join(',');
}

function inverseToken(token, sex) {
  const base = token.replace(/&[ol\d]+/g, '');
  switch (base) {
    case 'f':
    case 'm':
      return sex === 1 ? ['s'] : sex === 0 ? ['d'] : ['s', 'd'];
    case 's':
    case 'd':
      return sex === 1 ? ['f'] : sex === 0 ? ['m'] : ['f', 'm'];
    case 'h':
      return ['w'];
    case 'w':
      return ['h'];
    case 'ob':
      return sex === 1 ? ['lb'] : sex === 0 ? ['ls'] : ['lb', 'ls'];
    case 'lb':
      return sex === 1 ? ['ob'] : sex === 0 ? ['os'] : ['ob', 'os'];
    case 'os':
      return sex === 1 ? ['lb'] : sex === 0 ? ['ls'] : ['lb', 'ls'];
    case 'ls':
      return sex === 1 ? ['ob'] : sex === 0 ? ['os'] : ['ob', 'os'];
    case 'xb':
      return sex === 1 ? ['xb'] : sex === 0 ? ['xs'] : ['xb', 'xs'];
    case 'xs':
      return sex === 1 ? ['xb'] : sex === 0 ? ['xs'] : ['xb', 'xs'];
    default:
      return [base];
  }
}

export function invertSelector(selector, sex = -1) {
  if (!selector) return [];
  const tokens = selector.split(',').filter(Boolean).reverse();
  let acc = [''];
  for (const token of tokens) {
    const options = inverseToken(token, sex);
    const next = [];
    for (const prefix of acc) {
      for (const opt of options) {
        next.push(prefix ? `${prefix},${opt}` : opt);
      }
    }
    acc = dedupe(next);
  }
  return acc.sort();
}

function inferRequiresFromSelector(selector, reverse, sex, reverseSelectors) {
  const requires = [];
  if (selector.includes('xb')) requires.push('olderYoungerMaleSibling');
  if (selector.includes('xs')) requires.push('olderYoungerFemaleSibling');
  if (selector.includes('&o') || selector.includes('&l')) requires.push('cousinAgeRelativeToUser');
  if (isCousinBaseSelector(selector)) requires.push('cousinAgeRelativeToUser');
  if (reverse && sex === -1 && reverseSelectors.length > 1) requires.push('userSex');
  return dedupe(requires);
}

function isCousinBaseSelector(selector) {
  const cousinPrefixes = [
    'f,ob,',
    'f,lb,',
    'f,xb,',
    'f,os,',
    'f,ls,',
    'f,xs,',
    'm,ob,',
    'm,lb,',
    'm,xb,',
    'm,os,',
    'm,ls,',
    'm,xs,'
  ];
  return cousinPrefixes.some((prefix) => selector.startsWith(prefix)) && (selector.endsWith(',s') || selector.endsWith(',d'));
}

function applyResolvedFactsToSelector(selector, facts = {}) {
  if (!selector) return selector;
  if (!isCousinBaseSelector(selector)) return selector;
  if (facts.cousinAgeRelative === 'older') {
    return selector.replace(/,s$/, ',s&o').replace(/,d$/, ',d&o');
  }
  if (facts.cousinAgeRelative === 'younger') {
    return selector.replace(/,s$/, ',s&l').replace(/,d$/, ',d&l');
  }
  return selector;
}

function inferMissingFacts(chain, sex, reverse, reverseSelectors, selectorWithFacts, facts = {}) {
  const missing = [];
  chain.forEach((entry, index) => {
    if (entry.stepId === 'brotherAgeUnknown') missing.push(`step${index + 1}_brotherAgeOrder`);
    if (entry.stepId === 'sisterAgeUnknown') missing.push(`step${index + 1}_sisterAgeOrder`);
  });
  if (isCousinBaseSelector(selectorWithFacts) && !facts.cousinAgeRelative) {
    missing.push('cousinAgeRelative');
  }
  if (reverse && sex === -1 && reverseSelectors.length > 1) missing.push('userSex');
  return missing;
}

export function resolveConcept(input) {
  const { chain, stepsById, sex = -1, reverse = false, dialectData = null, facts = {} } = input;
  const selector = buildSelector(chain, stepsById);
  const selectorWithFacts = applyResolvedFactsToSelector(selector, facts);
  const reverseSelectors = reverse ? invertSelector(selectorWithFacts, sex) : [];
  const canonicalSelector = reverse ? reverseSelectors[0] || '' : selector;
  const canonicalWithFacts = reverse ? canonicalSelector : selectorWithFacts;
  const conceptId =
    CORE_SELECTOR_TO_CONCEPT_ID[canonicalWithFacts] ||
    selectorToGenericConceptId(canonicalWithFacts || selectorWithFacts, reverse);

  const dataRequires = dialectData?.concepts?.[conceptId]?.requires || [];
  const inferredRequires = inferRequiresFromSelector(canonicalWithFacts || selectorWithFacts, reverse, sex, reverseSelectors);
  const requires = dedupe([...dataRequires, ...inferredRequires]);
  const missingFacts = inferMissingFacts(chain, sex, reverse, reverseSelectors, selectorWithFacts, facts);

  return {
    conceptId,
    requires,
    missingFacts,
    selector: selectorWithFacts,
    reverseSelector: reverse ? canonicalSelector : null,
    reverseSelectors
  };
}

export function selectTerms(input) {
  const {
    conceptId,
    dialectId,
    dialectData,
    baselineTerms,
    customOverrides = {},
    requiresResolution = false
  } = input;

  const concept = dialectData?.concepts?.[conceptId] || null;
  const standardVariant = concept?.variants?.mandarin_standard || null;
  const standardPreferred =
    standardVariant?.preferred || concept?.canonical_mandarin?.[0] || (baselineTerms && baselineTerms[0]) || '';

  const conceptVariant = concept?.variants?.[dialectId] || null;
  let recommended = null;
  let confidence = conceptVariant?.confidence || standardVariant?.confidence || 'low';
  let provenance = 'fallback_mandarin';

  if (!requiresResolution) {
    if (dialectId === 'custom' && customOverrides[conceptId]) {
      const override = customOverrides[conceptId];
      recommended = typeof override === 'string' ? override : override.term;
      confidence = 'high';
      provenance = 'custom_override';
    } else if (conceptVariant?.preferred) {
      recommended = conceptVariant.preferred;
      provenance = 'dialect_variant';
    } else {
      recommended = standardPreferred;
    }
  }

  const sourceBacked = (conceptVariant?.sources?.length || 0) > 0;
  if (recommended && !baselineTerms.includes(recommended) && provenance === 'dialect_variant' && !sourceBacked) {
    recommended = standardPreferred;
    provenance = 'fallback_mandarin';
    confidence = 'low';
  }

  const alternatives = dedupe([
    ...(conceptVariant?.alternatives || []),
    ...(standardVariant?.alternatives || []),
    ...(concept?.canonical_mandarin || []),
    ...baselineTerms,
    standardPreferred
  ]).filter((term) => term !== recommended);

  if (standardPreferred && standardPreferred !== recommended && !alternatives.includes(standardPreferred)) {
    alternatives.unshift(standardPreferred);
  }

  const customSourceDialectId = provenance === 'custom_override' && typeof customOverrides[conceptId] === 'object'
    ? customOverrides[conceptId].sourceDialectId || null
    : null;

  return {
    recommended,
    alternatives,
    confidence,
    provenance,
    requiresResolution,
    concept,
    standardPreferred,
    customSourceDialectId
  };
}

function cleanLabel(label) {
  return label.replace(/\s*\(.*?\)\s*/g, '').trim();
}

function buildChainDescription(chain, stepsById) {
  return chain
    .map((entry) => {
      const step = stepsById[entry.stepId];
      return step ? cleanLabel(step.enLabel) : '?';
    })
    .join('\u2019s ');
}

export function getDisambiguationQuestions(input) {
  const { chain, stepsById, sex, reverseInfo, facts = {} } = input;
  const questions = [];

  chain.forEach((entry, i) => {
    if (entry.stepId === 'brotherAgeUnknown') {
      const prev = i > 0 ? stepsById[chain[i - 1].stepId] : null;
      questions.push({
        id: `brother-age-${i}`,
        question: prev
          ? `For step ${i + 1}, is this brother older or younger than ${prev.enLabel}?`
          : `For step ${i + 1}, is this brother older or younger than the reference person?`,
        type: 'replaceStep',
        stepIndex: i,
        options: [
          { label: 'Older', stepId: 'olderBrother' },
          { label: 'Younger', stepId: 'youngerBrother' }
        ]
      });
    }
    if (entry.stepId === 'sisterAgeUnknown') {
      const prev = i > 0 ? stepsById[chain[i - 1].stepId] : null;
      questions.push({
        id: `sister-age-${i}`,
        question: prev
          ? `For step ${i + 1}, is this sister older or younger than ${prev.enLabel}?`
          : `For step ${i + 1}, is this sister older or younger than the reference person?`,
        type: 'replaceStep',
        stepIndex: i,
        options: [
          { label: 'Older', stepId: 'olderSister' },
          { label: 'Younger', stepId: 'youngerSister' }
        ]
      });
    }
  });

  if (reverseInfo?.missingFacts?.includes('userSex') && sex === -1) {
    questions.push({
      id: 'user-sex-required',
      question: 'Reverse lookup needs your sex to avoid ambiguous family role. Choose one:',
      type: 'setSex',
      options: [
        { label: 'Male', sex: 1 },
        { label: 'Female', sex: 0 }
      ]
    });
  }

  const chainDesc = buildChainDescription(chain, stepsById);

  if (reverseInfo?.missingFacts?.includes('cousinAgeRelative')) {
    questions.push({
      id: 'cousin-age-relative',
      question: `Is your ${chainDesc} older or younger than you?`,
      type: 'setFact',
      factKey: 'cousinAgeRelative',
      options: [
        { label: 'Older than me', value: 'older' },
        { label: 'Younger than me', value: 'younger' }
      ]
    });
  }

  if (
    reverseInfo?.requires?.includes('cousinAgeRelativeToUser') &&
    !reverseInfo?.missingFacts?.includes('cousinAgeRelative') &&
    facts.cousinAgeRelative
  ) {
    questions.push({
      id: 'cousin-age-relative-resolved',
      question: `Is your ${chainDesc} older or younger than you?`,
      type: 'setFact',
      factKey: 'cousinAgeRelative',
      resolved: true,
      currentValue: facts.cousinAgeRelative,
      currentLabel: facts.cousinAgeRelative === 'older' ? 'Older than me' : 'Younger than me',
      options: [
        { label: 'Older than me', value: 'older' },
        { label: 'Younger than me', value: 'younger' }
      ]
    });
  }

  return questions;
}

export function createFallbackConcept(conceptId, baselineTerms) {
  const canonical = dedupe(baselineTerms).slice(0, 3);
  return {
    gloss_en: conceptId.replace(/_/g, ' '),
    requires: [],
    canonical_mandarin: canonical,
    variants: {
      mandarin_standard: {
        preferred: canonical[0] || '',
        alternatives: canonical.slice(1),
        confidence: 'low',
        sources: []
      }
    }
  };
}

export function applyQuestionAnswer(state, question, option) {
  if (question.type === 'replaceStep') {
    const next = state.chain.map((entry) => ({ ...entry }));
    next[question.stepIndex].stepId = option.stepId;
    if (next[question.stepIndex].rank) next[question.stepIndex].rank = null;
    const preserved = {};
    for (const [k, v] of Object.entries(state.facts || {})) {
      if (!k.startsWith(`step${question.stepIndex + 1}_`)) preserved[k] = v;
    }
    return { ...state, chain: next, facts: preserved };
  }
  if (question.type === 'setSex') {
    return { ...state, sex: option.sex };
  }
  if (question.type === 'setFact') {
    const facts = { ...(state.facts || {}) };
    facts[question.factKey] = option.value;
    return { ...state, facts };
  }
  return state;
}

export function getCoreSelectorMap() {
  return { ...CORE_SELECTOR_TO_CONCEPT_ID };
}
