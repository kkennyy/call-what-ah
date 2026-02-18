import relationship from './relationship.min.mjs';
import {
  DIALECT_STORAGE_KEY,
  CUSTOM_OVERRIDES_STORAGE_KEY,
  applyQuestionAnswer,
  buildTermGlossIndex,
  buildChineseText,
  getDisambiguationQuestions,
  resolveConcept,
  resolveEnglishGlossForTerm,
  selectTerms
} from './kinship_core.mjs';
import { getDialectRomanization, getMandarinPinyin } from './pronunciation_core.mjs';

const MAX_CACHE = 500;
const cache = new Map();
const MANDARIN_LANGS = ['zh-CN', 'zh-TW', 'zh-HK', 'zh-SG'];
const CANTONESE_LANGS = ['yue-HK', 'zh-HK', 'zh-CN', 'zh-SG'];
const HOKKIEN_LANGS = ['nan-TW', 'zh-TW', 'zh-CN', 'zh-SG'];
const TEOCHEW_LANGS = ['zh-CN', 'zh-SG', 'zh-TW'];
const HAKKA_LANGS = ['hak-TW', 'zh-TW', 'zh-CN', 'zh-SG'];
const HAINANESE_LANGS = ['zh-CN', 'zh-SG', 'zh-TW'];
const LATIN_FALLBACK_LANGS = ['en-SG', 'en-US', 'en-GB'];
const DIALECT_SPEECH_PROFILES = {
  mandarin_standard: {
    langs: MANDARIN_LANGS,
    voiceKeywords: ['mandarin', 'putonghua', 'chinese']
  },
  cantonese_sg: {
    langs: CANTONESE_LANGS,
    voiceKeywords: ['cantonese', 'yue', 'hong kong']
  },
  hokkien_sg: {
    langs: HOKKIEN_LANGS,
    voiceKeywords: ['hokkien', 'taiwanese', 'minnan', 'nan']
  },
  teochew_sg: {
    langs: TEOCHEW_LANGS,
    voiceKeywords: ['teochew', 'chiuchow', 'chaozhou', 'chaoshan']
  },
  hakka_sg: {
    langs: HAKKA_LANGS,
    voiceKeywords: ['hakka', 'kejia']
  },
  hainanese_sg: {
    langs: HAINANESE_LANGS,
    voiceKeywords: ['hainanese', 'hainan']
  },
  custom: {
    langs: MANDARIN_LANGS,
    voiceKeywords: ['mandarin', 'putonghua', 'chinese']
  }
};

let stepsData = [];
let stepsById = {};
let numerals = {};
let connector = '?';
let dialectData = null;
let romanizationData = null;
let termGlossIndex = new Map();
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
let activeSpeechButton = null;

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

function hasSpeechSupport() {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof window.SpeechSynthesisUtterance === 'function';
}

function findBestVoice(preferredLangs, voiceKeywords = []) {
  if (!hasSpeechSupport()) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;
  const wants = (preferredLangs || []).map((lang) => String(lang).toLowerCase());
  const keywords = (voiceKeywords || []).map((keyword) => String(keyword).toLowerCase());

  if (keywords.length) {
    for (const lang of wants) {
      const exactKeyword = voices.find((voice) => {
        const voiceLang = String(voice.lang || '').toLowerCase();
        const voiceName = String(voice.name || '').toLowerCase();
        return voiceLang === lang && keywords.some((kw) => voiceName.includes(kw));
      });
      if (exactKeyword) return exactKeyword;
    }
  }

  for (const lang of wants) {
    const exact = voices.find((voice) => String(voice.lang || '').toLowerCase() === lang);
    if (exact) return exact;
  }
  for (const lang of wants) {
    const prefix = lang.split('-')[0];
    const family = voices.find((voice) => String(voice.lang || '').toLowerCase().startsWith(prefix));
    if (family) return family;
  }

  if (keywords.length) {
    const keywordOnly = voices.find((voice) => {
      const voiceName = String(voice.name || '').toLowerCase();
      return keywords.some((kw) => voiceName.includes(kw));
    });
    if (keywordOnly) return keywordOnly;
  }

  return null;
}

function setSpeechButtonState(button, playing) {
  if (!button) return;
  const playLabel = button.dataset.playLabel || 'Play';
  button.classList.toggle('playing', playing);
  button.textContent = playing ? 'Stop' : playLabel;
}

function resetActiveSpeechButton() {
  if (!activeSpeechButton) return;
  setSpeechButtonState(activeSpeechButton, false);
  activeSpeechButton = null;
}

function stopSpeechPlayback() {
  if (!hasSpeechSupport()) return;
  window.speechSynthesis.cancel();
  resetActiveSpeechButton();
}

function getDialectSpeechProfile(dialectId) {
  return DIALECT_SPEECH_PROFILES[dialectId] || DIALECT_SPEECH_PROFILES.mandarin_standard;
}

function buildDialectSpeechPlan({ term, dialectId, mandarinPinyin, dialectRomanization }) {
  if (!term) return null;
  const profile = getDialectSpeechProfile(dialectId);

  const candidates = [{
    text: term,
    preferredLangs: profile.langs,
    voiceKeywords: profile.voiceKeywords
  }];

  if (dialectRomanization?.text && !dialectRomanization.isFallback) {
    candidates.push({
      text: dialectRomanization.text,
      preferredLangs: LATIN_FALLBACK_LANGS,
      voiceKeywords: []
    });
  }

  if (mandarinPinyin) {
    candidates.push({
      text: mandarinPinyin,
      preferredLangs: LATIN_FALLBACK_LANGS,
      voiceKeywords: []
    });
  }

  candidates.push({
    text: term,
    preferredLangs: MANDARIN_LANGS,
    voiceKeywords: ['mandarin', 'putonghua', 'chinese']
  });

  return { candidates };
}

function buildMandarinSpeechPlan({ term, mandarinPinyin }) {
  if (!term) return null;
  const candidates = [{
    text: term,
    preferredLangs: MANDARIN_LANGS,
    voiceKeywords: ['mandarin', 'putonghua', 'chinese']
  }];

  if (mandarinPinyin) {
    candidates.push({
      text: mandarinPinyin,
      preferredLangs: LATIN_FALLBACK_LANGS,
      voiceKeywords: []
    });
  }

  return { candidates };
}

function speakPlan(plan, button) {
  if (!plan || !hasSpeechSupport()) return false;
  const synth = window.speechSynthesis;

  if (activeSpeechButton === button && synth.speaking) {
    stopSpeechPlayback();
    return true;
  }

  stopSpeechPlayback();

  const candidates = Array.isArray(plan.candidates) && plan.candidates.length
    ? plan.candidates
    : [{ text: plan.text, preferredLangs: plan.preferredLangs || MANDARIN_LANGS, voiceKeywords: [] }];
  let selected = candidates[0];
  let voice = null;

  for (const candidate of candidates) {
    if (!candidate?.text) continue;
    const preferredLangs = Array.isArray(candidate.preferredLangs) && candidate.preferredLangs.length
      ? candidate.preferredLangs
      : MANDARIN_LANGS;
    voice = findBestVoice(preferredLangs, candidate.voiceKeywords || []);
    selected = { ...candidate, preferredLangs };
    if (voice) break;
  }

  const utterance = new window.SpeechSynthesisUtterance(selected.text);
  utterance.lang = selected.preferredLangs[0];
  if (voice) utterance.voice = voice;
  utterance.rate = 0.9;
  utterance.pitch = 1;

  activeSpeechButton = button;
  setSpeechButtonState(button, true);

  const cleanup = () => {
    if (activeSpeechButton === button) {
      setSpeechButtonState(button, false);
      activeSpeechButton = null;
    }
  };
  utterance.onend = cleanup;
  utterance.onerror = cleanup;

  synth.speak(utterance);
  return true;
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

function renderTermChip(term, idx = 0, englishGloss = null) {
  const shell = document.createElement('div');
  shell.className = 'chip-shell';

  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.style.animationDelay = `${idx * 0.04}s`;

  const textWrap = document.createElement('span');
  textWrap.className = 'chip-text-wrap';

  const textSpan = document.createElement('span');
  textSpan.className = 'chip-text';
  const chars = [...term];
  let pinyinArr = [];
  if (pinyinFn) {
    try {
      pinyinArr = pinyinFn(term, { type: 'array' }) || [];
    } catch {
      pinyinArr = [];
    }
  }
  const mandarinPinyinFromArray = pinyinArr.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean).join(' ');
  const mandarinPinyin = mandarinPinyinFromArray || getMandarinPinyin(term, pinyinFn);

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
  textWrap.appendChild(textSpan);

  const dialectRomanization = getDialectRomanization(term, state.dialectId, romanizationData, mandarinPinyin);
  if (dialectRomanization) {
    const line = document.createElement('span');
    line.className = 'chip-roman-line';

    const system = document.createElement('span');
    system.className = 'chip-roman-system';
    system.textContent = `${dialectRomanization.systemName}:`;
    line.appendChild(system);

    if (dialectRomanization.isFallback) {
      const fallback = document.createElement('span');
      fallback.className = 'chip-roman-fallback';
      fallback.textContent = 'fallback';
      line.appendChild(fallback);
    }

    const value = document.createElement('span');
    value.className = 'chip-roman-text';
    value.textContent = dialectRomanization.text;
    line.appendChild(value);

    textWrap.appendChild(line);
  }

  if (englishGloss) {
    const englishLine = document.createElement('span');
    englishLine.className = 'chip-en-line';
    englishLine.textContent = `English: ${englishGloss}`;
    textWrap.appendChild(englishLine);
  }

  chip.appendChild(textWrap);

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

  shell.appendChild(chip);

  const controls = document.createElement('span');
  controls.className = 'chip-audio-controls';

  const dialectBtn = document.createElement('button');
  dialectBtn.type = 'button';
  dialectBtn.className = 'chip-audio-btn';
  dialectBtn.dataset.playLabel = 'Dialect';
  dialectBtn.textContent = dialectBtn.dataset.playLabel;
  dialectBtn.setAttribute('aria-label', `Play dialect pronunciation for ${term}`);

  const mandarinBtn = document.createElement('button');
  mandarinBtn.type = 'button';
  mandarinBtn.className = 'chip-audio-btn';
  mandarinBtn.dataset.playLabel = 'Mandarin';
  mandarinBtn.textContent = mandarinBtn.dataset.playLabel;
  mandarinBtn.setAttribute('aria-label', `Play Mandarin pronunciation for ${term}`);

  if (!hasSpeechSupport()) {
    dialectBtn.disabled = true;
    mandarinBtn.disabled = true;
    dialectBtn.title = 'Speech synthesis is not supported in this browser';
    mandarinBtn.title = 'Speech synthesis is not supported in this browser';
  } else {
    const dialectSpeechPlan = buildDialectSpeechPlan({
      term,
      dialectId: state.dialectId,
      mandarinPinyin,
      dialectRomanization
    });
    const mandarinSpeechPlan = buildMandarinSpeechPlan({
      term,
      mandarinPinyin
    });

    dialectBtn.title = 'Play selected dialect pronunciation';
    mandarinBtn.title = 'Play Mandarin pronunciation';
    dialectBtn.addEventListener('click', () => speakPlan(dialectSpeechPlan, dialectBtn));
    mandarinBtn.addEventListener('click', () => speakPlan(mandarinSpeechPlan, mandarinBtn));
  }

  controls.appendChild(dialectBtn);
  controls.appendChild(mandarinBtn);
  shell.appendChild(controls);
  return shell;
}

function renderRecommended(selection, conceptId, englishGlossByTerm = new Map(), canPin = false) {
  dom.recommendedContainer.innerHTML = '';
  if (!selection.recommended) {
    const empty = document.createElement('div');
    empty.className = 'results-empty';
    empty.textContent = 'Need more details before recommending a single term.';
    dom.recommendedContainer.appendChild(empty);
    dom.pinTermBtn.hidden = true;
    dom.pinTermBtn.dataset.term = '';
    dom.pinTermBtn.dataset.conceptId = conceptId || '';
    return;
  }

  const chips = document.createElement('div');
  chips.className = 'chips';
  chips.appendChild(renderTermChip(selection.recommended, 0, englishGlossByTerm.get(selection.recommended) || null));
  dom.recommendedContainer.appendChild(chips);

  dom.pinTermBtn.hidden = !canPin;
  dom.pinTermBtn.disabled = !canPin;
  dom.pinTermBtn.dataset.term = canPin ? selection.recommended : '';
  dom.pinTermBtn.dataset.conceptId = canPin ? conceptId : '';
}

function renderAlternatives(alternatives, englishGlossByTerm = new Map()) {
  dom.resultsContainer.innerHTML = '';
  if (!alternatives.length) {
    dom.alternativesHeading.hidden = true;
    dom.resultsContainer.hidden = true;
    return;
  }
  dom.alternativesHeading.hidden = false;
  dom.resultsContainer.hidden = false;
  const chips = document.createElement('div');
  chips.className = 'chips';
  alternatives.forEach((term, idx) => {
    chips.appendChild(renderTermChip(term, idx, englishGlossByTerm.get(term) || null));
  });
  dom.resultsContainer.appendChild(chips);
}

function renderDisambiguation(questions) {
  dom.refinementArea.innerHTML = '';
  questions.forEach((q) => {
    const panel = document.createElement('div');
    panel.className = q.resolved ? 'refine-panel refine-resolved' : 'refine-panel';

    if (q.resolved) {
      const label = document.createElement('div');
      label.className = 'refine-label refine-label-resolved';
      label.textContent = 'Answered';
      panel.appendChild(label);

      const summary = document.createElement('div');
      summary.className = 'refine-summary';
      summary.textContent = `${q.question} \u2014 ${q.currentLabel}`;
      panel.appendChild(summary);

      const changeBtn = document.createElement('button');
      changeBtn.type = 'button';
      changeBtn.className = 'refine-change-btn';
      changeBtn.textContent = 'Change';
      changeBtn.addEventListener('click', () => {
        delete state.facts[q.factKey];
        update();
      });
      panel.appendChild(changeBtn);
    } else {
      const label = document.createElement('div');
      label.className = 'refine-label';
      label.textContent = 'Needs your input';
      panel.appendChild(label);

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
    }

    dom.refinementArea.appendChild(panel);
  });

  if (questions.some((q) => !q.resolved)) {
    dom.refinementArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function update() {
  stopSpeechPlayback();

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

  const questions = getDisambiguationQuestions({
    chain: state.chain,
    stepsById,
    sex: state.sex,
    reverseInfo: conceptInfo,
    facts: state.facts
  });
  renderDisambiguation(questions);

  const visibleTerms = dedupe([
    ...(selection.recommended ? [selection.recommended] : []),
    ...acceptable
  ]);
  const englishGlossByTerm = new Map();
  const activeConcept = selection.concept || dialectData?.concepts?.[conceptInfo.conceptId] || null;
  visibleTerms.forEach((term) => {
    const gloss = resolveEnglishGlossForTerm({
      term,
      concept: activeConcept,
      conceptId: conceptInfo.conceptId,
      selector: conceptInfo.selector,
      reverseSelector: conceptInfo.reverseSelector,
      reverse: state.reverse,
      termGlossIndex
    });
    if (gloss) englishGlossByTerm.set(term, gloss);
  });

  dom.resultsSection.hidden = false;
  renderRecommended(selection, conceptInfo.conceptId, englishGlossByTerm, acceptable.length > 0);
  renderAlternatives(acceptable, englishGlossByTerm);
}

function wireEvents() {
  dom.addStepBtn.addEventListener('click', () => {
    state.chain.push({ stepId: stepsData[0].id, rank: null });
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
    note.textContent = `Saved "${term}" as your family term for this relationship. Set Dialect Preference to Custom to use it.`;
    dom.recommendedContainer.appendChild(note);
  });
}

async function loadData() {
  const [stepsResp, dialectResp, romanizationResp] = await Promise.all([
    fetch('./kinship_en_steps.json'),
    fetch('./dialect_variants.json'),
    fetch('./dialect_romanization.json').catch(() => null)
  ]);
  const stepsJson = await stepsResp.json();
  const dialectJson = await dialectResp.json();
  let romanizationJson = { systems: {}, overrides: {} };
  if (romanizationResp?.ok) {
    try {
      romanizationJson = await romanizationResp.json();
    } catch {
      romanizationJson = { systems: {}, overrides: {} };
    }
  }

  stepsData = stepsJson.steps || [];
  stepsById = Object.fromEntries(stepsData.map((s) => [s.id, s]));
  numerals = stepsJson.numerals || {};
  connector = stepsJson.buildText?.connector || '?';
  dialectData = dialectJson;
  romanizationData = romanizationJson;
  termGlossIndex = buildTermGlossIndex(dialectJson);
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
  dom.alternativesHeading = document.getElementById('alternatives-heading');
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

  if (hasSpeechSupport()) window.speechSynthesis.getVoices();

  state.customOverrides = getStoredJson(CUSTOM_OVERRIDES_STORAGE_KEY, {});
  state.dialectId = localStorage.getItem(DIALECT_STORAGE_KEY) || 'mandarin_standard';

  state.chain.push({ stepId: stepsData[0].id, rank: null });

  renderDialectDropdown();
  wireEvents();
  renderChain();
  update();
}
