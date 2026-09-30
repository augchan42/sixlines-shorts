// The 64 hexagrams as the corners of a six-dimensional cube (docs/superpowers/specs/
// 2026-09-30-structure-shorts-design.md): values as in ./diagram.ts (bottom line the most
// significant bit), two corners joined when they differ by one line.

export const neighbours = (v: number) => [0, 1, 2, 3, 4, 5].map((i) => v ^ (32 >> i));
export const opposite = (v: number) => v ^ 63;
export const edges = () => [...Array(64).keys()].flatMap((v) => neighbours(v).filter((w) => w > v).map((w) => [v, w] as [number, number]));
// From a to b one line at a time, bottom line first: a, then each step, ending at b.
export const path = (a: number, b: number) => {
  const out = [a];
  let v = a;
  for (let i = 0; i < 6; i++) {
    const bit = 32 >> i;
    if ((v ^ b) & bit) out.push((v ^= bit));
  }
  return out;
};
