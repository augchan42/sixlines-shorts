// Shannon's measure of information, in bits: how much a result tells you, on average, given the
// odds of each result (docs/superpowers/specs/2026-09-30-shannon-six-bits-design.md).
export const entropy = (probs: number[]) => -probs.filter((p) => p > 0).reduce((h, p) => h + p * Math.log2(p), 0);

// The odds of a line's four results: old yin, young yang, young yin, old yang.
export const COINS = [1 / 8, 3 / 8, 3 / 8, 1 / 8];
export const YARROW = [1 / 16, 5 / 16, 7 / 16, 3 / 16];
