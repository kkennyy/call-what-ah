# Call What Ah?

Deterministic Chinese kinship address finder (static web app) built on top of `relationship.js`.

The app takes a structured relationship chain (no free-text parsing), resolves it to valid kinship terms, and presents:
- a dialect-aware recommendation
- explicit acceptable alternatives
- follow-up clarification questions when facts are missing
- pinyin/romanization and optional browser speech playback

## Core Principles

- Deterministic only: no AI/LLM/NLP inference.
- Structured input only: chain-builder steps, not free-text.
- Never hide ambiguity: unresolved cases stay unresolved until clarified.
- Preserve baseline correctness from `relationship.js`.

## Current Feature Set

- Step-based relationship builder (`father`, `mother`, sibling, child, spouse, etc.)
- Rank support for older/younger sibling steps (`1..10`)
- Chinese chain preview (`的` connector from `kinship_en_steps.json`)
- Reverse lookup mode ("how they address me")
- Dialect preference dropdown:
  - `mandarin_standard`
  - `cantonese_sg`
  - `hokkien_sg`
  - `teochew_sg`
  - `hakka_sg`
  - `hainanese_sg`
  - `custom`
- Clarification workflow for missing facts:
  - unknown sibling age order
  - cousin age relative to user
  - user sex when reverse mode requires it
- Recommended term + alternatives display
- Copy-to-clipboard chips
- Mandarin pinyin + dialect romanization line per term
- Speech synthesis buttons per term (`Dialect` and `Mandarin`)
- Custom household term pinning (used when dialect is `custom`)
- Light/dark theme toggle

## Architecture

- `index.html`: full UI markup + styles + bootstrapping script
- `app.mjs`: app state, DOM rendering, events, data loading, speech and chip UX
- `kinship_core.mjs`: deterministic selector resolution, concept mapping, term selection, disambiguation questions, English gloss logic
- `pronunciation_core.mjs`: Mandarin pinyin helper + dialect romanization fallback logic
- `relationship.min.mjs`: upstream deterministic kinship engine

## Data Files

- `kinship_en_steps.json`
  - 12 step definitions
  - selector hints and text-construction metadata
- `dialect_variants.json`
  - dialect metadata + concept map
  - current generated concept count: 4691
  - generated metadata date: `2026-02-16`
- `dialect_romanization.json`
  - romanization systems, dialect overrides, generated Mandarin fallback map
  - generated metadata date: `2026-02-17`
- `relationship.data.min.json`
  - upstream relationship dataset snapshot/reference

## Local Development

Prerequisites:
- Modern browser
- Node.js 18+ (for scripts/tests; `fetch` is used in generation scripts)
- Any local static file server

Run:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

Do not open via `file://` because module/JSON fetches will fail.

## Testing

Run all tests:

```bash
node tests/run-tests.mjs
```

Included test suites:
- `tests/dialect-preferences.test.mjs`
- `tests/romanization.test.mjs`

## Data Regeneration Workflow

When dialect data or source-backed mappings change:

```bash
node scripts/generate_dialect_variants.mjs
node scripts/normalize_sources.mjs
node scripts/generate_dialect_romanization.mjs
node tests/run-tests.mjs
```

Scripts:
- `scripts/generate_dialect_variants.mjs`: rebuilds concept/dialect preference dataset from curated overrides + relationship selectors.
- `scripts/normalize_sources.mjs`: normalizes source records (URL/title/accessed/notes) and de-dupes alternatives.
- `scripts/generate_dialect_romanization.mjs`: rebuilds romanization systems/overrides plus Mandarin fallback pinyin map.

## Persistence (localStorage)

- `cwah.settings.dialectPreference`
- `cwah.customDialectOverrides.v1`
- `cwah.settings.theme`

## Repository Layout

- `README.md`: project overview and usage
- `AGENT.md`: contributor/agent guardrails and invariants
- `index.html`: UI and styles
- `app.mjs`: app controller/state/rendering logic
- `kinship_core.mjs`: deterministic domain logic
- `pronunciation_core.mjs`: pronunciation and romanization helpers
- `scripts/`: data generation/normalization utilities
- `tests/`: deterministic test coverage
- `docs/dialect-preferences.md`: detailed rationale and source notes

## License & Attribution

- Upstream `relationship.js` attribution/license is retained in `LICENSE_mumuy_relationship.txt`.
- App footer also attributes `relationship.js` (MIT).
