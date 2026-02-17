function cleanToken(token) {
  return typeof token === 'string' ? token.trim() : '';
}

export function getMandarinPinyin(term, pinyinFn) {
  if (!term || typeof pinyinFn !== 'function') return null;
  try {
    const arr = pinyinFn(term, { type: 'array' });
    if (Array.isArray(arr) && arr.length > 0) {
      const joined = arr.map(cleanToken).filter(Boolean).join(' ');
      return joined || null;
    }
    const text = cleanToken(pinyinFn(term));
    return text || null;
  } catch {
    return null;
  }
}

export function getDialectRomanization(term, dialectId, romanizationData, mandarinPinyin) {
  if (!term || !dialectId || !romanizationData) return null;
  if (dialectId === 'mandarin_standard') return null;

  const system = romanizationData.systems?.[dialectId] || null;
  const systemName = system?.name || 'Dialect Romanization';
  const dialectOverrides = romanizationData.overrides?.[dialectId] || null;
  const override = dialectOverrides?.[term] || null;

  if (override?.roman) {
    return {
      text: override.roman,
      systemName,
      isFallback: false,
      confidence: override.confidence || 'low'
    };
  }

  if (mandarinPinyin) {
    return {
      text: mandarinPinyin,
      systemName,
      isFallback: true,
      confidence: 'low'
    };
  }

  return null;
}
