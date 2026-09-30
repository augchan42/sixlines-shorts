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

// When the drawings happen, in seconds from the page's start, and the machine sounds that go with
// them (src/scenes/Diagram.tsx draws on the same times): a sweep as the ring or the tree's row
// appears, a warble as the camera arrives, a relay's click at each step of a count and each digit
// written, and a relay bank's chatter while the tree grows.
export const BIT_TIMES = (from: number) => [0, 1, 2, 3, 4, 5].map((i) => from + 2 + i * 0.4);
export const TREE_STAGE = 0.9;
export type Cue = { at: number; sound: "relay" | "sweep" | "warble" | "chatter"; secs?: number };
// The Six Bits short: one line flipping like a tossed coin, slower each time, 1 s after `from`;
// and the yarrow odds, four bars growing one after another, then the level they share.
export const LINE_FLIPS = (from: number) => [0, 0.22, 0.46, 0.74, 1.08, 1.5, 2.02, 2.66].map((t) => from + t);
export const ODDS_TIMES = (from: number) => [0, 1.2, 2.4, 3.6, 5].map((t) => from + t);
type CueShow = { kind?: string; count?: [number, number]; at?: number; secs?: number; weights?: boolean; fadePlate?: boolean; morph?: number };
export const diagramCues = (d: CueShow): Cue[] => {
  const kind = d.kind ?? "count";
  if (kind === "count" && d.count) {
    const [a, b] = d.count;
    const at = d.at ?? 5;
    const secs = d.secs ?? 10;
    const n = b - a;
    // The counter shows the nearest whole value, so it steps as the count passes each half.
    const steps = [...Array(n).keys()].map((k): Cue => ({ at: at + (secs * (k + 0.5)) / n, sound: "relay" }));
    return [{ at: 0.2, sound: "sweep" }, { at: at - 0.3, sound: "warble" }, ...steps];
  }
  if (kind === "bits") return d.weights ? [...(d.fadePlate ? [{ at: 0.4, sound: "sweep" } as Cue] : []), ...BIT_TIMES(d.fadePlate ? 1.4 : 0.2).map((at): Cue => ({ at, sound: "relay" }))] : [];
  if (kind === "tree") {
    const start = d.at ?? 1;
    // A tree already grown when the page opens stays quiet.
    if (start < 0) return [];
    return [{ at: start, sound: "chatter", secs: 6 * TREE_STAGE + 0.5 }, ...(d.morph !== undefined ? [{ at: d.morph, sound: "sweep" } as Cue] : [])];
  }
  if (kind === "line") return LINE_FLIPS(d.at ?? 1).map((at): Cue => ({ at, sound: "relay" }));
  if (kind === "odds") {
    const t = ODDS_TIMES(d.at ?? 1);
    return [...t.slice(0, 4).map((at): Cue => ({ at, sound: "relay" })), { at: t[4], sound: "warble" }];
  }
  if (kind === "overview") return [{ at: 0.2, sound: "sweep" }];
  if (kind === "square") return [{ at: 0.3, sound: "sweep" }, { at: (d.at ?? 3) + 5.5, sound: "warble" }];
  return [];
};
