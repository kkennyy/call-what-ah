# Call What Ah?

Deterministic Mandarin kinship address finder (static web app).

The app uses a structured relationship chain (no free-text NLP) and returns:
- baseline valid Mandarin terms from `relationship.js`
- dialect-aware recommendations
- explicit follow-up questions when details are missing

## Tech Stack

- Static frontend: `index.html` + ES modules
- Core resolver: `relationship.min.mjs`
- App logic: `app.mjs`, `kinship_core.mjs`
- Data: `kinship_en_steps.json`, `dialect_variants.json`

## Run Locally

Serve the repo with any local web server (do not use `file://` because JSON/module loading will fail).

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Tests

```bash
node tests/run-tests.mjs
```

## Regenerate Dialect Data

```bash
node scripts/generate_dialect_variants.mjs
node scripts/generate_dialect_romanization.mjs
node scripts/normalize_sources.mjs
node tests/run-tests.mjs
```

## Project Layout

- `index.html`: UI and styling
- `app.mjs`: state, rendering, events, integration
- `kinship_core.mjs`: selector/concept resolution and term selection
- `tests/`: deterministic test coverage
- `docs/dialect-preferences.md`: dialect behavior details

## Notes

- Local storage keys: `cwah.settings.dialectPreference`, `cwah.customDialectOverrides.v1`
- Upstream `relationship.js` attribution/license retained in `LICENSE_mumuy_relationship.txt`.
