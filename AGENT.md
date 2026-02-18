# AGENT.md

## Mission

Maintain a deterministic, explainable kinship-address app. Correctness, traceability, and reproducibility are higher priority than stylistic or speculative changes.

Primary objective: given a structured relationship chain, return valid Mandarin baseline terms, dialect-aware recommendations, and explicit clarification prompts when facts are missing.

## Non-Negotiable Product Constraints

1. No AI/LLM inference and no free-text NLP parsing.
2. Input must remain structured (step-based chain builder).
3. `relationship.js` remains the baseline validator.
4. Ambiguity must remain explicit until user clarifies it.
5. Recommendation logic must be data-driven and inspectable.
6. Keep `relationship.js` attribution/license (`LICENSE_mumuy_relationship.txt`).

## Current Stack

- Static frontend: `index.html` + ES modules.
- Runtime app controller: `app.mjs`.
- Deterministic domain logic: `kinship_core.mjs`.
- Pronunciation utilities: `pronunciation_core.mjs`.
- Baseline kinship engine: `relationship.min.mjs`.
- Data:
  - `kinship_en_steps.json`
  - `dialect_variants.json`
  - `dialect_romanization.json`
  - `relationship.data.min.json` (reference snapshot)

## Repository Map

- `index.html`: UI markup, styles, and boot script.
- `app.mjs`: state, rendering, browser events, speech playback, persistence, data loading.
- `kinship_core.mjs`: selector construction/inversion, concept resolution, disambiguation questions, term selection, English gloss logic.
- `pronunciation_core.mjs`: Mandarin pinyin extraction and dialect romanization fallback behavior.
- `scripts/generate_dialect_variants.mjs`: regenerates concept/dialect dataset.
- `scripts/normalize_sources.mjs`: normalizes source entries and alternatives.
- `scripts/generate_dialect_romanization.mjs`: regenerates romanization systems/overrides/fallback map.
- `tests/dialect-preferences.test.mjs`: deterministic concept/selection/gloss coverage.
- `tests/romanization.test.mjs`: romanization and fallback behavior.
- `tests/run-tests.mjs`: test entrypoint.
- `docs/dialect-preferences.md`: rationale and source details.

## Runtime Flow (Authoritative)

1. User builds a chain from controlled steps.
2. App builds:
   - Chinese text (`buildChineseText`) for `relationship.js`.
   - selector (`buildSelector`) for internal deterministic concept resolution.
3. `lookup(...)` calls `relationship(...)` with cache and stable de-duplication.
4. `resolveConcept(...)` computes:
   - `conceptId`
   - `requires`
   - `missingFacts`
   - reverse selectors (when reverse mode is enabled)
5. `selectTerms(...)` returns:
   - `recommended` (or `null` if unresolved facts remain)
   - `alternatives`
   - provenance/confidence metadata
6. UI renders:
   - disambiguation panels/questions
   - recommended/acceptable chips
   - optional term gloss, pinyin, dialect romanization, speech controls

## Behavioral Invariants

1. Determinism: same inputs must produce same outputs.
2. De-duplication order: preserve first-seen order.
3. Unresolved facts:
   - must not force a single recommendation
   - must keep alternatives visible
4. Custom overrides:
   - apply only when dialect is `custom`
   - stored explicitly in localStorage
5. Dialect recommendation fallback rule:
   - if dialect preferred term is not in baseline terms and lacks source backing, fallback to standard preferred term.
6. Reverse mode:
   - preserve selector inversion behavior from `invertSelector(...)`
   - avoid hidden assumptions when sex is unknown.
7. Speech/pinyin:
   - app must work even if `pinyin-pro` or speech synthesis is unavailable.

## Persistence Contracts

Do not rename/remove without migration:
- `cwah.settings.dialectPreference`
- `cwah.customDialectOverrides.v1`
- `cwah.settings.theme`

## Data Contracts

- `dialect_variants.json`:
  - `dialects[]` defines selectable dialect IDs/labels.
  - `concepts[conceptId]` drives recommendation behavior.
  - variant `sources` entries should remain normalized.
- `dialect_romanization.json`:
  - `systems` maps dialect -> romanization system metadata.
  - `overrides` maps dialect -> per-term romanization.
  - `mandarinFallback` is used when dialect mapping is unavailable.
- `kinship_en_steps.json`:
  - step IDs/selectors must align with UI flow and tests.

## Change Rules

1. Prefer minimal targeted edits.
2. Preserve backward compatibility for persisted keys and current data schema.
3. Do not bypass `kinship_core.mjs` with ad hoc UI heuristics.
4. If you add/rename step IDs:
   - update UI rendering paths
   - update selector logic/tests.
5. If you change dialect concept mapping:
   - keep sources/provenance coherent
   - rerun generation + normalization + tests.
6. If you adjust disambiguation:
   - verify both unresolved and resolved-state UI behavior.
7. Keep accessibility intact (labels, button semantics, keyboard-safe controls).

## Testing Requirements

Run for logic/data changes:

```bash
node tests/run-tests.mjs
```

If regenerating dialect data:

```bash
node scripts/generate_dialect_variants.mjs
node scripts/normalize_sources.mjs
node scripts/generate_dialect_romanization.mjs
node tests/run-tests.mjs
```

## Manual Validation Checklist

1. Chain creation/removal works and preview updates correctly.
2. Reverse toggle changes output deterministically.
3. Unknown sibling/cousin age prompts appear when expected.
4. Resolved facts display as answered and can be changed.
5. Recommended and alternatives sections are both correct.
6. Custom pinning persists and activates in `custom` dialect.
7. Pinyin/romanization lines render without breaking chips.
8. Speech buttons behave safely when unsupported.
9. Theme preference persists across reload.

## Definition of Done for Agent Changes

- Deterministic behavior preserved.
- No regression in baseline validity relative to `relationship.js`.
- Ambiguity remains explicit and user-resolvable.
- Tests pass locally after meaningful changes.
- Documentation/tests updated when behavior or schemas change.
- License attribution remains present.
