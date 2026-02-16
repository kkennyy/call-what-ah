# AGENT.md

## Purpose
This repository is a deterministic kinship-term web app. Agents should preserve correctness, explainability, and reproducibility over novelty.

Primary goal: given a structured relationship chain, return the correct Mandarin address terms and dialect-aware recommendations without using AI/NLP.

## Product Constraints (Non-Negotiable)
1. No AI, no LLM inference, no free-text NLP parsing.
2. Input must stay structured (step-based chain builder).
3. The app must show all valid baseline outputs when ambiguity exists.
4. Recommendations must be logic/data-driven and traceable.
5. Keep MIT attribution/license for `relationship.js` (`LICENSE_mumuy_relationship.txt`).

## Technical Stack
- Frontend: static HTML + ES modules.
- Core engine: `relationship.min.mjs` (deterministic kinship resolver).
- App logic: `app.mjs`.
- Domain logic/utilities: `kinship_core.mjs`.
- Data:
  - `kinship_en_steps.json` (step definitions)
  - `dialect_variants.json` (dialect preferences and sources)
  - `relationship.data.min.json` (engine data snapshot / reference)

## Repository Map
- `index.html`: UI structure and styling.
- `app.mjs`: state management, rendering, event handling, integration with core logic.
- `kinship_core.mjs`: selector building, concept resolution, ambiguity handling, dialect term selection.
- `scripts/generate_dialect_variants.mjs`: dialect dataset generation/refresh.
- `scripts/normalize_sources.mjs`: dialect source normalization.
- `tests/dialect-preferences.test.mjs`: deterministic behavior tests.
- `tests/run-tests.mjs`: test entrypoint.
- `docs/dialect-preferences.md`: feature behavior and rationale.

## Runtime Behavior
1. User builds a relationship chain from controlled step options.
2. App converts chain into:
   - Chinese text for `relationship.js` lookup.
   - Selector string for deterministic concept resolution.
3. `relationship.js` returns baseline valid terms (de-duped, stable order).
4. `resolveConcept(...)` computes concept ID, requires/missing facts, reverse mode handling.
5. `selectTerms(...)` chooses:
   - `recommended` term when resolvable.
   - `alternatives` preserving acceptable options.
6. UI prompts deterministic clarification questions when facts are missing.

## Data and Logic Contracts
- Keep selector-driven logic deterministic.
- Preserve de-duplication with first-seen order.
- Do not collapse alternatives into a single answer when unresolved facts remain.
- Custom household overrides must remain explicit and user-controlled.
- Local storage keys in use:
  - `cwah.settings.dialectPreference`
  - `cwah.customDialectOverrides.v1`

## Development Rules
1. Prefer small, targeted changes over broad rewrites.
2. Maintain backward compatibility for persisted localStorage keys.
3. For new step types, update both UI flow and selector logic.
4. For new dialect preferences, include source-backed entries where possible.
5. Do not hardcode opaque heuristics that bypass `kinship_core.mjs`.
6. Keep ambiguity explicit: ask focused follow-up questions instead of guessing.
7. Preserve accessibility basics (labels, keyboard-friendly controls, clear states).

## Testing and Validation
Run after meaningful logic/data changes:

```bash
node tests/run-tests.mjs
```

If dialect data is regenerated:

```bash
node scripts/generate_dialect_variants.mjs
node scripts/normalize_sources.mjs
node tests/run-tests.mjs
```

Manual sanity checks:
1. Build representative chains from paternal/maternal lines.
2. Verify unresolved cousin/sibling age cases request clarification.
3. Verify reverse mode still resolves deterministically.
4. Verify dialect recommendation + alternatives display correctly.
5. Verify pinning custom terms persists across reloads.

## Change Acceptance Checklist
- Deterministic behavior preserved (no AI/NLP).
- No regression to baseline `relationship.js` validity.
- Ambiguous cases remain explicit and safe.
- Dialect recommendation changes are source-backed or clearly marked fallback.
- Tests pass locally.
- License attribution remains intact.

## Agent Workflow Guidance
1. Read relevant files before editing (`app.mjs`, `kinship_core.mjs`, tests, docs).
2. Implement minimal changes that satisfy the request.
3. Update tests/docs when behavior changes.
4. Run tests when logic/data is modified.
5. Report what changed, why it changed, and any residual risk.
