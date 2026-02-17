# Dialect Preferences

## Why this exists
The app is deterministic and chain-driven (no free text parsing). Many kinship chains can still map to multiple acceptable address terms across households and dialect backgrounds in Singapore. This feature adds a **Family Dialect Preference** layer that changes recommendation ordering while preserving factual correctness.

## Deterministic behavior
- Concept resolution is computed from structured chain selectors, not from final output strings.
- If required facts are missing (for example elder vs younger in `brotherAgeUnknown` / `sisterAgeUnknown`), the app asks targeted questions and does not force a single recommendation.
- `relationship.js` remains the baseline validator for Mandarin-acceptable outputs.
- Dialect-preferred terms are allowed even when not first in `relationship.js` output, if they are mapped to the same concept and source-backed in `dialect_variants.json`.

## Scope and limits
- Data coverage includes curated core concepts (parents' siblings and spouses, grandparents, cousin categories) plus large auto-generated fallback coverage from concrete `relationship.data` selectors up to length 6.
- Dialect usage varies by family and subcommunity. The app intentionally shows alternatives.
- Hakka and Hainanese entries are currently partial; unresolved entries are tagged with `confidence: low` and explicit fallback notes.

## User-visible flow
1. Build relationship chain in steps.
2. Select dialect preference in **Settings**.
3. View:
   - **Recommended (your dialect)**
   - **Also acceptable**
   - Dialect romanization line under each term (with explicit fallback label if dialect-specific romanization is unavailable)
4. Pin household-preferred term using **Pin my family's term**.
   - Stored in `localStorage` key `cwah.customDialectOverrides.v1`
   - Dialect preference key: `cwah.settings.dialectPreference`

## Example (dad's older sister)
- Standard Mandarin: `??` (alternatives: `??`, `??`)
- Cantonese-style (SG): `??` (alternatives include `??`)
- Hokkien-style (SG): `??`
- Teochew-style (SG): `??` (low-confidence in current build)
- Hakka-style (SG): `??` (partial coverage)
- Hainanese-style (SG): fallback to Mandarin where unverified

## Ranking prefixes and ?-prefix
- Ranking prefixes such as `?/?/?/?` are preserved through chain construction and represented in data concepts (`ranking_prefix_usage_*`).
- Common `?-` prefix usage is documented and represented (`a_prefix_usage_general`), but household variation is expected.

## Sources (accessed 2026-02-16)
- `relationship.js` (MIT): https://github.com/mumuy/relationship
- CUHK Cantonese lexicon: https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/
- CUHK term pages:
  - ?: https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/search.php?q=%A9%68
  - ?: https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/search.php?q=%A7%42
  - ?: https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/search.php?q=%A8%FB
  - ?: https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/search.php?q=%AB%BC
  - ?: https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/search.php?q=%B8%A4
- MOE Taiwan Minnan dictionary: https://sutian.moe.edu.tw/
  - ??: https://sutian.moe.edu.tw/zh-hant/su/4556/
  - ??: https://sutian.moe.edu.tw/zh-hant/su/4626/
  - ??: https://sutian.moe.edu.tw/zh-hant/su/4567/
  - ??: https://sutian.moe.edu.tw/zh-hant/su/4508/
  - ??: https://sutian.moe.edu.tw/zh-hant/su/4621/
- MOE Taiwan Hakka dictionary: https://hakkadict.moe.edu.tw/
- Singapore dialect context:
  - SCCC research/public education portal: https://www.singaporeccc.org.sg/our-work/research-public-education/
  - Languages of Singapore overview: https://en.wikipedia.org/wiki/Languages_of_Singapore

## License retention
This project retains `LICENSE_mumuy_relationship.txt` for `relationship.js` (MIT) and continues to attribute engine usage in the app footer.
