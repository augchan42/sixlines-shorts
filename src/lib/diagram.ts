// The order of Shao Yong's diagram, as Bouvet sent it to Leibniz in 1701: the ring of the 64
// hexagrams with the 8x8 square inside it (docs/superpowers/specs/2026-09-30-leibniz-diagram-design.md).
// Lines are bottom first, 0 broken and 1 solid; the bottom line is the most significant bit, so
// Kun is 0 and Qian 63.

export type Lines = (0 | 1)[];

export const value = (lines: Lines) => lines.reduce<number>((v, l) => v * 2 + l, 0);
export const linesOf = (v: number): Lines => [5, 4, 3, 2, 1, 0].map((b) => ((v >> b) & 1) as 0 | 1);
export const bitsOf = (v: number) => linesOf(v).join("");

// Degrees clockwise from the top of the ring, as the woodcut is printed. Qian (63) is just left
// of the top and Gou (31) just right of it; Fu (32) and Kun (0) meet at the bottom. So the count
// climbs the right half from Kun to Gou, then the left half from Fu to Qian.
const STEP = 360 / 64;
export const ringAngle = (v: number) => (v < 32 ? (31.5 - v) * STEP : -(63.5 - v) * STEP);

// Rows share a lower trigram and columns an upper one: Kun top left, Qian bottom right.
export const squareCell = (v: number) => ({ row: v >> 3, col: v & 7 });

// The doubling tree: node k of row `depth` (2^depth nodes, left to right) is the first `depth`
// lines, bottom first; each split adds a broken line on the left and a solid one on the right.
export const treeNode = (depth: number, k: number): Lines => linesOf(k).slice(6 - depth);
