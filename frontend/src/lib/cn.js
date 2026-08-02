/** Conditional className joiner — falsy entries drop out. */
export const cn = (...values) => values.filter(Boolean).join(' ');
