import relationship from './relationship.min.mjs';
import {
  DIALECT_STORAGE_KEY,
  CUSTOM_OVERRIDES_STORAGE_KEY,
  applyQuestionAnswer,
  buildChineseText,
  getDisambiguationQuestions,
  resolveConcept,
  selectTerms
} from './kinship_core.mjs';

const MAX_CACHE = 500;
const cache = new Map();

let stepsData = [];
let stepsById = {};
let numerals = {};
let connector = '?';
let dialectData = null;
let pinyinFn = null;

let state = {
  chain: [],
  sex: -1,
  reverse: false,
  dialectId: 'mandarin_standard',
  customOverrides: {},
  facts: {}
};

const dom = {};

function dedupe(list) {
  return [...new Set((list || []).filter(Boolean))];
}

function getStoredJson(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallbackValue;
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

function setStoredJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readSelectedSex() {
  const checked = document.querySelector('input[name="sex"]:checked');
  return checked ? parseInt(checked.value, 10) : -1;
}

function setSexInput(value) {
  const radio = document.querySelector(`input[name="sex"][value="${value}"]`);
  if (radio) radio.checked = true;
}

function lookup(text, sex, reverse) {
  const key = `${sex}|${reverse}|${text}`;
  if (cache.has(key)) return cache.get(key);
  const raw = relationship({
    text,
    sex,
    reverse,
    mode: 'default',
    type: 'default',
    optimal: false
  });
  const results = dedupe(raw || []);
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(key, results);
  return results;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function persistDialect() {
  localStorage.setItem(DIALECT_STORAGE_KEY, state.dialectId);
}

function persistOverrides() {
  setStoredJson(CUSTOM_OVERRIDES_STORAGE_KEY, state.customOverrides);
}

function renderDialectDropdown() {
  const select = dom.dialectSelect;
  select.innerHTML = '';
  (dialectData?.dialects || []).forEach((dialect) => {
    const opt = document.createElement('option');
    opt.value = dialect.id;
    opt.textContent = dialect.label;
    if (dialect.id === state.dialectId) opt.selected = true;
    select.appendChild(opt);
  });
}

function renderChain() {
  dom.chainContainer.innerHTML = '';
  state.chain.forEach((entry, i) => {
    const step = stepsById[entry.stepId];

    const row = document.createElement('div');
    row.className = 'step-row';

    const num = document.createElement('span');
    num.className = 'step-num';
    num.textContent = i + 1;
    row.appendChild(num);

    const sel = document.createElement('select');
    sel.setAttribute('aria-label', `Relationship step ${i + 1}`);
    stepsData.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.enLabel;
      if (entry.stepId === s.id) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      state.chain[i].stepId = sel.value;
      const selectedStep = stepsById[sel.value];
      if (!selectedStep.rankable) state.chain[i].rank = null;
      state.facts = {};
      renderChain();
      update();
    });
    row.appendChild(sel);

    if (step?.rankable) {
      const rankSel = document.createElement('select');
      rankSel.className = 'rank-select';
      rankSel.setAttribute('aria-label', `Rank for step ${i + 1}`);

      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = '#';
      rankSel.appendChild(blank);

      for (let rank = 1; rank <= 10; rank += 1) {
        const opt = document.createElement('option');
        opt.value = rank;
        opt.textContent = rank;
        if (entry.rank === rank) opt.selected = true;
        rankSel.appendChild(opt);
      }

      rankSel.addEventListener('change', () => {
        state.chain[i].rank = rankSel.value ? parseInt(rankSel.value, 10) : null;
        state.facts = {};
        update();
      });
      row.appendChild(rankSel);
    }

    if (state.chain.length > 1) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn-remove';
      remove.setAttribute('aria-label', `Remove step ${i + 1}`);
      remove.innerHTML = '&times;';
      remove.addEventListener('click', () => {
        state.chain.splice(i, 1);
        state.facts = {};
        renderChain();
        update();
      });
      row.appendChild(remove);
    }

    dom.chainContainer.appendChild(row);
  });
}

function renderTermChip(term, idx = 0) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.style.animationDelay = `${idx * 0.04}s`;

  const textSpan = document.createElement('span');
  textSpan.className = 'chip-text';
  const chars = [...term];
  const pinyinArr = pinyinFn ? pinyinFn(term, { type: 'array' }) : [];
  chars.forEach((ch, ci) => {
    const col = document.createElement('span');
    col.className = 'char-col';
    const charEl = document.createElement('span');
    charEl.className = 'char';
    charEl.textContent = ch;
    col.appendChild(charEl);
    if (pinyinArr[ci]) {
      const pyEl = document.createElement('span');
      pyEl.className = 'py';
      pyEl.textContent = pinyinArr[ci];
      col.appendChild(pyEl);
    }
    textSpan.appendChild(col);
  });
  chip.appendChild(textSpan);

  const hint = document.createElement('span');
  hint.className = 'copy-hint';
  hint.textContent = 'copy';
  chip.appendChild(hint);

  chip.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(term);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = term;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    chip.classList.add('copied');
    hint.textContent = 'copied!';
    setTimeout(() => {
      chip.classList.remove('copied');
      hint.textContent = 'copy';
    }, 1200);
  });

  return chip;
}

function renderRecommended(selection, conceptId) {
  dom.recommendedContainer.innerHTML = '';
  if (!selection.recommended) {
    const empty = document.createElement('div');
    empty.className = 'results-empty';
    empty.textContent = 'Need more details before recommending a single term.';
    dom.recommendedContainer.appendChild(empty);
    dom.pinTermBtn.disabled = true;
    dom.pinTermBtn.dataset.term = '';
    dom.pinTermBtn.dataset.conceptId = conceptId || '';
    return;
  }

  const chips = document.createElement('div');
  chips.className = 'chips';
  chips.appendChild(renderTermChip(selection.recommended));
  dom.recommendedContainer.appendChild(chips);

  const meta = document.createElement('div');
  meta.className = 'results-note';
  meta.textContent = `Confidence: ${selection.confidence} (${selection.provenance.replace(/_/g, ' ')})`;
  dom.recommendedContainer.appendChild(meta);

  dom.pinTermBtn.disabled = false;
  dom.pinTermBtn.dataset.term = selection.recommended;
  dom.pinTermBtn.dataset.conceptId = conceptId;
}

function renderAlternatives(alternatives) {
  dom.resultsContainer.innerHTML = '';
  if (!alternatives.length) {
    const empty = document.createElement('div');
    empty.className = 'results-empty';
    empty.textContent = 'No alternatives available.';
    dom.resultsContainer.appendChild(empty);
    return;
  }
  const chips = document.createElement('div');
  chips.className = 'chips';
  alternatives.forEach((term, idx) => chips.appendChild(renderTermChip(term, idx)));
  dom.resultsContainer.appendChild(chips);
}

function renderDisambiguation(questions) {
  dom.refinementArea.innerHTML = '';
  questions.forEach((q) => {
    const panel = document.createElement('div');
    panel.className = 'refine-panel';

    const title = document.createElement('div');
    title.className = 'refine-question';
    title.textContent = q.question;
    panel.appendChild(title);

    const opts = document.createElement('div');
    opts.className = 'refine-options';
    q.options.forEach((option) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'refine-btn';
      btn.textContent = option.label;
      btn.addEventListener('click', () => {
        state = applyQuestionAnswer(state, q, option);
        if (q.type === 'setSex') setSexInput(state.sex);
        renderChain();
        update();
      });
      opts.appendChild(btn);
    });
    panel.appendChild(opts);

    dom.refinementArea.appendChild(panel);
  });
}

function update() {
  state.sex = readSelectedSex();
  state.reverse = dom.reverseToggle.checked;

  const zhText = buildChineseText(state.chain, stepsById, numerals, connector);
  if (!zhText) {
    dom.previewSection.hidden = true;
    dom.resultsSection.hidden = true;
    dom.refinementArea.innerHTML = '';
    return;
  }

  dom.previewSection.hidden = false;
  dom.chainPreview.innerHTML = `<span class="zh-text">${escapeHtml(zhText)}</span>`;

  const baseline = lookup(zhText, state.sex, state.reverse);
  const conceptInfo = resolveConcept({
    chain: state.chain,
    stepsById,
    sex: state.sex,
    reverse: state.reverse,
    dialectData,
    facts: state.facts
  });

  const selection = selectTerms({
    conceptId: conceptInfo.conceptId,
    dialectId: state.dialectId,
    dialectData,
    baselineTerms: baseline,
    customOverrides: state.customOverrides,
    requiresResolution: conceptInfo.missingFacts.length > 0
  });

  const acceptable = dedupe([
    ...selection.alternatives,
    ...(selection.recommended ? [selection.recommended] : []),
    ...baseline
  ]).filter((term) => term !== selection.recommended);

  dom.resultsSection.hidden = false;
  renderRecommended(selection, conceptInfo.conceptId);
  renderAlternatives(acceptable);

  const hasMultiple = acceptable.length > 0;
  dom.sourcesNote.textContent = hasMultiple
    ? 'Different families and dialects use different address terms; choose what your family uses.'
    : 'Single deterministic recommendation available for current details.';

  const questions = getDisambiguationQuestions({
    chain: state.chain,
    stepsById,
    sex: state.sex,
    reverseInfo: conceptInfo
  });
  renderDisambiguation(questions);
}

function wireEvents() {
  dom.addStepBtn.addEventListener('click', () => {
    state.chain.push({ stepId: stepsData[0].id, rank: null });
    state.facts = {};
    renderChain();
    update();
  });

  document.getElementById('sex-selector').addEventListener('change', () => update());

  dom.reverseToggle.addEventListener('change', () => update());

  dom.dialectSelect.addEventListener('change', () => {
    state.dialectId = dom.dialectSelect.value;
    persistDialect();
    update();
  });

  dom.pinTermBtn.addEventListener('click', () => {
    const conceptId = dom.pinTermBtn.dataset.conceptId;
    const term = dom.pinTermBtn.dataset.term;
    if (!conceptId || !term) return;
    state.customOverrides[conceptId] = term;
    persistOverrides();

    const note = document.createElement('div');
    note.className = 'results-note';
    note.textContent = `Pinned "${term}" for ${conceptId}. Switch preference to Custom to always use it.`;
    dom.recommendedContainer.appendChild(note);
  });
}

async function loadData() {
  const [stepsResp, dialectResp] = await Promise.all([
    fetch('./kinship_en_steps.json'),
    fetch('./dialect_variants.json')
  ]);
  const stepsJson = await stepsResp.json();
  const dialectJson = await dialectResp.json();

  stepsData = stepsJson.steps || [];
  stepsById = Object.fromEntries(stepsData.map((s) => [s.id, s]));
  numerals = stepsJson.numerals || {};
  connector = stepsJson.buildText?.connector || '?';
  dialectData = dialectJson;
}

function assignDomRefs() {
  dom.chainContainer = document.getElementById('chain-container');
  dom.addStepBtn = document.getElementById('add-step-btn');
  dom.reverseToggle = document.getElementById('reverse-toggle');
  dom.previewSection = document.getElementById('preview-section');
  dom.chainPreview = document.getElementById('chain-preview');
  dom.resultsSection = document.getElementById('results-section');
  dom.recommendedContainer = document.getElementById('recommended-container');
  dom.resultsContainer = document.getElementById('results-container');
  dom.refinementArea = document.getElementById('refinement-area');
  dom.dialectSelect = document.getElementById('dialect-select');
  dom.pinTermBtn = document.getElementById('pin-term-btn');
  dom.sourcesNote = document.getElementById('sources-note');
}

export async function initApp() {
  assignDomRefs();

  try {
    await loadData();
  } catch (err) {
    document.querySelector('main').innerHTML =
      '<p class="loading">Failed to load data files. Please serve this page from a web server (not file://).</p>';
    return;
  }

  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/pinyin-pro/+esm');
    pinyinFn = mod.pinyin;
  } catch {
    pinyinFn = null;
  }

  state.customOverrides = getStoredJson(CUSTOM_OVERRIDES_STORAGE_KEY, {});
  state.dialectId = localStorage.getItem(DIALECT_STORAGE_KEY) || 'mandarin_standard';

  state.chain.push({ stepId: stepsData[0].id, rank: null });

  renderDialectDropdown();
  wireEvents();
  renderChain();
  update();
}
