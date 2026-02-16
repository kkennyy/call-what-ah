import fs from 'fs';

const INPUT = 'dialect_variants.json';
const OUTPUT = 'dialect_variants.json';

function normalizeSource(src) {
  return {
    url: String(src.url || '').trim(),
    title: String(src.title || '').trim(),
    accessed: String(src.accessed || '').trim(),
    notes: String(src.notes || '').trim()
  };
}

function normalize() {
  const raw = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  for (const concept of Object.values(raw.concepts || {})) {
    for (const variant of Object.values(concept.variants || {})) {
      variant.sources = (variant.sources || []).map(normalizeSource).filter((s) => s.url && s.title && s.accessed);
      variant.alternatives = [...new Set((variant.alternatives || []).filter(Boolean))];
      if (variant.preferred) {
        variant.alternatives = variant.alternatives.filter((item) => item !== variant.preferred);
      }
    }
  }
  fs.writeFileSync(OUTPUT, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
  console.log('Normalized sources in dialect_variants.json');
}

normalize();