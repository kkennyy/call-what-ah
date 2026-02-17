import fs from 'fs';

const INPUT = 'dialect_variants.json';
const OUTPUT = 'dialect_romanization.json';

const SYSTEMS = {
  mandarin_standard: { name: 'Hanyu Pinyin', toneFormat: 'marks' },
  cantonese_sg: { name: 'Jyutping', toneFormat: 'numbers' },
  hokkien_sg: { name: 'Tai-lo', toneFormat: 'numbers' },
  teochew_sg: { name: "Peng'im", toneFormat: 'numbers' },
  hakka_sg: { name: 'PFS', toneFormat: 'numbers' },
  hainanese_sg: { name: 'Hainanese Romanization', toneFormat: 'numbers' },
  custom: { name: 'Family Romanization', toneFormat: 'custom' }
};

const CURATED_OVERRIDES = {
  cantonese_sg: {
    姑妈: { roman: 'gu maa1', confidence: 'high', sourceBacked: true },
    姑姐: { roman: 'gu ze2', confidence: 'medium', sourceBacked: true },
    大姑: { roman: 'daai6 gu1', confidence: 'medium', sourceBacked: true },
    伯父: { roman: 'baak3 fu6', confidence: 'high', sourceBacked: true },
    叔叔: { roman: 'suk1 suk1', confidence: 'high', sourceBacked: true },
    舅父: { roman: 'kau5 fu6', confidence: 'high', sourceBacked: true },
    阿姨: { roman: 'aa3 ji4', confidence: 'medium', sourceBacked: true }
  },
  hokkien_sg: {
    阿姑: { roman: 'a-ku', confidence: 'high', sourceBacked: true },
    阿舅: { roman: 'a-ku', confidence: 'high', sourceBacked: true },
    阿姨: { roman: 'a-i', confidence: 'medium', sourceBacked: true },
    阿公: { roman: 'a-kong', confidence: 'high', sourceBacked: true },
    阿妈: { roman: 'a-ma', confidence: 'high', sourceBacked: true }
  },
  teochew_sg: {
    阿姑: { roman: 'a1 gou1', confidence: 'medium', sourceBacked: true },
    阿伯: { roman: 'a1 beh4', confidence: 'medium', sourceBacked: true },
    阿叔: { roman: 'a1 zig4', confidence: 'medium', sourceBacked: true },
    阿舅: { roman: 'a1 gu6', confidence: 'medium', sourceBacked: true },
    阿姨: { roman: 'a1 i5', confidence: 'medium', sourceBacked: true }
  },
  hakka_sg: {
    阿姑: { roman: 'a1 gu1', confidence: 'medium', sourceBacked: true },
    伯父: { roman: 'bag4 fu3', confidence: 'medium', sourceBacked: true },
    叔叔: { roman: 'sug5 sug5', confidence: 'medium', sourceBacked: true },
    阿舅: { roman: 'a1 kiu5', confidence: 'medium', sourceBacked: true },
    阿姨: { roman: 'a1 i1', confidence: 'medium', sourceBacked: true }
  },
  hainanese_sg: {
    阿公: { roman: 'a1 gong1', confidence: 'low', sourceBacked: false },
    阿妈: { roman: 'a1 ma1', confidence: 'low', sourceBacked: false },
    阿姨: { roman: 'a1 yi1', confidence: 'low', sourceBacked: false }
  }
};

function dedupe(list) {
  return [...new Set((list || []).filter(Boolean))];
}

async function loadPinyinFn() {
  const resp = await fetch('https://cdn.jsdelivr.net/npm/pinyin-pro/+esm');
  if (!resp.ok) {
    throw new Error(`Failed to fetch pinyin-pro: ${resp.status}`);
  }
  const code = await resp.text();
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  const mod = await import(url);
  if (typeof mod.pinyin !== 'function') {
    throw new Error('pinyin-pro module did not export pinyin function');
  }
  return mod.pinyin;
}

function buildTermUniverse(dialectJson) {
  const byDialect = {};
  Object.keys(SYSTEMS).forEach((dialectId) => {
    byDialect[dialectId] = new Set();
  });

  for (const concept of Object.values(dialectJson.concepts || {})) {
    for (const [dialectId, variant] of Object.entries(concept.variants || {})) {
      if (!byDialect[dialectId]) byDialect[dialectId] = new Set();
      const terms = dedupe([variant?.preferred, ...(variant?.alternatives || [])]);
      terms.forEach((term) => byDialect[dialectId].add(term));
    }
  }
  return byDialect;
}

function collectAllTerms(termUniverse) {
  const all = new Set();
  for (const terms of Object.values(termUniverse)) {
    for (const term of terms) all.add(term);
  }
  return all;
}

function selectOverrides(termUniverse) {
  const output = {};
  for (const dialectId of Object.keys(SYSTEMS)) {
    if (dialectId === 'mandarin_standard' || dialectId === 'custom') continue;
    const curated = CURATED_OVERRIDES[dialectId] || {};
    const terms = termUniverse[dialectId] || new Set();
    const kept = {};
    for (const [term, data] of Object.entries(curated)) {
      if (terms.has(term)) kept[term] = data;
    }
    output[dialectId] = kept;
  }
  return output;
}

function buildMandarinFallback(allTerms, pinyinFn) {
  const out = {};
  for (const term of allTerms) {
    try {
      const arr = pinyinFn(term, { type: 'array' }) || [];
      const joined = arr.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean).join(' ');
      if (joined) out[term] = joined;
    } catch {
      // Keep deterministic output: skip unconvertible term.
    }
  }
  return out;
}

async function main() {
  const dialectJson = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  const termUniverse = buildTermUniverse(dialectJson);
  const allTerms = collectAllTerms(termUniverse);
  const overrides = selectOverrides(termUniverse);
  let mandarinFallback = {};
  try {
    const pinyinFn = await loadPinyinFn();
    mandarinFallback = buildMandarinFallback(allTerms, pinyinFn);
  } catch (err) {
    console.warn(`Warning: could not build mandarinFallback map: ${err?.message || err}`);
  }
  const generatedAt = new Date().toISOString().slice(0, 10);

  const output = {
    meta: {
      version: '1.0.0',
      generatedAt,
      notes: 'Dialect romanization overrides with fallback rules'
    },
    systems: SYSTEMS,
    overrides,
    mandarinFallback
  };

  fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  for (const dialectId of Object.keys(SYSTEMS)) {
    if (dialectId === 'mandarin_standard') continue;
    const totalTerms = (termUniverse[dialectId] || new Set()).size;
    const overrideCount = Object.keys(overrides[dialectId] || {}).length;
    const fallbackCount = Math.max(totalTerms - overrideCount, 0);
    const pct = totalTerms > 0 ? ((overrideCount / totalTerms) * 100).toFixed(2) : '0.00';
    console.log(
      `${dialectId}: override_count=${overrideCount} fallback_count=${fallbackCount} override_percent=${pct}%`
    );
  }

  console.log(`Generated ${OUTPUT}`);
}

await main();
