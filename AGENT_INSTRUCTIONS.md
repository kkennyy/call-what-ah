# Build brief: deterministic Mandarin kinship address app (no AI)

## Objective
Build a web app that outputs the **correct Mandarin kinship term(s)** to address someone, based on a user-constructed relationship chain in English.

Key constraint: **no AI / no NLP**. The UI must **force structured input** (step-by-step relationship builder).

## Recommended engine
Use the MIT-licensed open-source kinship engine **relationship.js** (or the TypeScript port **relationship-ts**) which deterministically computes Chinese kinship terms and returns a list of valid outputs when user input is ambiguous.

- relationship.js repo: https://github.com/mumuy/relationship
- relationship-ts (TypeScript port): https://github.com/ExploringTheCodeWorld/relationship-ts

## Data bundle provided
You will receive (at minimum):
- `relationship.min.mjs` (relationship.js compiled ESM build)
- `relationship.data.min.json` (extracted full data table, mainly for inspection/debug)
- `kinship_en_steps.json` (authoritative mapping: English UI step -> Chinese token)
- `LICENSE_mumuy_relationship.txt` (MIT license, must be retained)

## UX design (non-AI, structured)
### 1) Inputs
1. **User sex**: Male, Female, Unknown (required to reduce ambiguity for in-law terms).
2. **Relationship chain builder**: a list of steps. Each step is chosen from a fixed set (father, mother, older brother, younger sister, son, daughter, husband, wife, etc).
   - Use the `kinship_en_steps.json` `steps[]` list to populate dropdowns.
3. **Optional rank** for rankable steps (eg 二哥, 三叔).
4. **Optional “I am addressing” vs “they address me”** toggle (relationship.js supports `reverse:true`).

### 2) Output
- Display **all valid results** returned by the engine.
- If there is exactly 1 result, display it as the answer.
- If multiple results exist, show them all, and optionally show a refinement panel.

### 3) Refinement panel (deterministic)
When results contain pairs like:
- `...哥` vs `...弟`, or `...姐` vs `...妹`: ask “Is the person older than you?” and filter.
- `伯...` vs `叔...`: ask “Is your father’s brother older than your father?” and filter.

Important: this refinement is **logic-based filtering on returned strings**, not AI.

## Core algorithm
### A) Build the Chinese relationship text
1. Each selected step has a `zhToken`.
2. If rank is supplied and the step is rankable, prefix with the Chinese numeral:
   - Example: rank=2, olderBrother(哥哥) => 二哥
3. Join all tokens with the connector `的`.
   - Example chain: father -> olderBrother -> son
   - Text: 爸爸的哥哥的儿子

### B) Call the engine
Use relationship.js:
```js
import relationship from './relationship.min.mjs';

const terms = relationship({
  text: zhText,
  sex: userSex,        // 1 male, 0 female, -1 unknown
  type: 'default',
  reverse: false,
  mode: 'default',
  optimal: false
});
```
- `terms` is an array of strings.
- De-duplicate and preserve order.

### C) Display
- Show the terms as clickable chips.
- Provide a “copy” function.
- For CNY practicality, consider showing:
  - first term as “most common”, with a note that multiple valid answers exist when the relationship is underspecified.

## Engineering notes
1. **No free-text parsing**. If you must support text input, constrain it to a controlled grammar (eg `father > olderBrother > son`), not arbitrary English.
2. Cache outputs by `(userSex, zhText, reverse, mode)`.
3. Provide unit tests for common paths:
   - 爸爸的哥哥 => 伯伯/伯父
   - 爸爸的弟弟 => 叔叔/叔父
   - 妈妈的哥哥 => 舅舅
   - 妈妈的姐妹 => 阿姨/姨妈 (may return multiple)
   - 爸爸的哥哥的儿子 => 堂哥/堂弟
   - 妈妈的哥哥的儿子 => 舅表哥/舅表弟

## Regional preferences
Default relationship.js outputs are broadly Standard Mandarin but include some variants.
If the product requires Singapore-Mandarin preferences (eg prefer “阿姨” over “姨妈”), implement a **mode override** using relationship.js `setMode()` to reorder or replace particular term lists.

## Compliance
Keep the MIT license notice in distributed source and include `LICENSE_mumuy_relationship.txt`.

