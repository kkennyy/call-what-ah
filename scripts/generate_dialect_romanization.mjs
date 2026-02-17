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

const CANTONESE_TERM_MAP = {
  '\u59d1\u8868\u54e5': 'gu1 biu2 go1',
  '\u59d1\u8868\u5f1f': 'gu1 biu2 dai6',
  '\u59d1\u8868\u59d0': 'gu1 biu2 ze2',
  '\u59d1\u8868\u59b9': 'gu1 biu2 mui6',
  '\u8205\u8868\u54e5': 'kau5 biu2 go1',
  '\u8205\u8868\u5f1f': 'kau5 biu2 dai6',
  '\u8205\u8868\u59d0': 'kau5 biu2 ze2',
  '\u8205\u8868\u59b9': 'kau5 biu2 mui6',
  '\u59e8\u8868\u54e5': 'ji4 biu2 go1',
  '\u59e8\u8868\u5f1f': 'ji4 biu2 dai6',
  '\u59e8\u8868\u59d0': 'ji4 biu2 ze2',
  '\u59e8\u8868\u59b9': 'ji4 biu2 mui6'
};

const CANTONESE_CHAR_MAP = {
  '\u4e08': 'zoeng6',
  '\u4e09': 'saam1',
  '\u4e0a': 'soeng6',
  '\u4e16': 'sai3',
  '\u4e24': 'loeng5',
  '\u4e2b': 'aa1',
  '\u4e94': 'ng5',
  '\u4eb2': 'can1',
  '\u4eba': 'jan4',
  '\u4ece': 'cung4',
  '\u4ed4': 'zai2',
  '\u4ef2': 'zung6',
  '\u4f2f': 'baak3',
  '\u4f6c': 'lou2',
  '\u4f84': 'zat6',
  '\u513f': 'ji4',
  '\u5143': 'jyun4',
  '\u5144': 'hing1',
  '\u5148': 'sin1',
  '\u516c': 'gung1',
  '\u516d': 'luk6',
  '\u5185': 'noi6',
  '\u518d': 'zoi3',
  '\u5343': 'cin1',
  '\u53d4': 'suk1',
  '\u540c': 'tung4',
  '\u54e5': 'go1',
  '\u56e1': 'naam4',
  '\u5802': 'tong4',
  '\u58fb': 'sai3',
  '\u5916': 'ngoi6',
  '\u5927': 'daai6',
  '\u5929': 'tin1',
  '\u592a': 'taai3',
  '\u592b': 'fu1',
  '\u5934': 'tau4',
  '\u5973': 'neoi5',
  '\u5976': 'naai5',
  '\u5987': 'fu5',
  '\u5988': 'maa1',
  '\u5997': 'kam5',
  '\u59af': 'zuk6',
  '\u59b9': 'mui6',
  '\u59bb': 'cai1',
  '\u59c6': 'mou5',
  '\u59ca': 'zi2',
  '\u59cf': 'maan4',
  '\u59d0': 'ze2',
  '\u59d1': 'gu1',
  '\u59e5': 'lou5',
  '\u59e8': 'ji4',
  '\u59fb': 'jan1',
  '\u5a0c': 'lei5',
  '\u5a18': 'noeng4',
  '\u5a46': 'po4',
  '\u5a76': 'sam2',
  '\u5a7f': 'sai3',
  '\u5ab3': 'sik1',
  '\u5ac2': 'sou2',
  '\u5b37': 'maa1',
  '\u5b50': 'zi2',
  '\u5b59': 'syun1',
  '\u5b63': 'gwai3',
  '\u5bb6': 'gaa1',
  '\u5c0f': 'siu2',
  '\u5cb3': 'ngok6',
  '\u5f1f': 'dai6',
  '\u5f25': 'mei4',
  '\u5f52': 'gwai1',
  '\u6069': 'jan1',
  '\u606f': 'sik1',
  '\u638c': 'zoeng2',
  '\u65b0': 'san1',
  '\u6606': 'kwan1',
  '\u665c': 'kwan1',
  '\u66fe': 'zang1',
  '\u6765': 'loi4',
  '\u6865': 'kiu4',
  '\u6bcd': 'mou5',
  '\u6bd1': 'ze2',
  '\u70c8': 'lit6',
  '\u7236': 'fu6',
  '\u7237': 'je4',
  '\u7238': 'baa4',
  '\u7239': 'de1',
  '\u7384': 'jyun4',
  '\u73e0': 'zyu1',
  '\u751f': 'saang1',
  '\u7525': 'saang1',
  '\u7537': 'naam4',
  '\u7737': 'gyun3',
  '\u7956': 'zou2',
  '\u79bb': 'lei4',
  '\u7ec6': 'sai3',
  '\u7fc1': 'jung1',
  '\u8001': 'lou5',
  '\u80de': 'baau1',
  '\u8180': 'bong2',
  '\u8205': 'kau5',
  '\u837b': 'dik6',
  '\u8868': 'biu2',
  '\u895f': 'kam1',
  '\u8fdc': 'jyun5',
  '\u8fde': 'lin4',
  '\u90ce': 'long4',
  '\u91cd': 'cung4',
  '\u91d1': 'gam1',
  '\u95fa': 'gwai1',
  '\u963f': 'aa3',
  '\u9ad8': 'gou1'
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

function toCantoneseJyutping(term) {
  if (CANTONESE_TERM_MAP[term]) return CANTONESE_TERM_MAP[term];
  const chars = [...term];
  const tokens = [];
  for (const ch of chars) {
    const roman = CANTONESE_CHAR_MAP[ch];
    if (!roman) return null;
    tokens.push(roman);
  }
  return tokens.join(' ');
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
    if (dialectId === 'cantonese_sg') {
      for (const term of terms) {
        if (kept[term]) continue;
        const roman = toCantoneseJyutping(term);
        if (!roman) continue;
        kept[term] = {
          roman,
          confidence: 'medium',
          sourceBacked: false,
          method: 'char_map'
        };
      }
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
