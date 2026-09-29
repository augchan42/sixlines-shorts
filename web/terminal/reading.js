// web/terminal/reading.js
// A port of godot/wangbi-terminal/reading.gd: the lesson's structural reading of a hexagram,
// after Wang Bi: places (略例·辯位), answering pairs (應), and the master he names in his notes.
// Lines are bottom-first arrays of 0 (yin) and 1 (yang); line numbers run 1-6 from the bottom.

export const NO_MASTER = "WANG BI NAMES NO MASTER HERE";
const TAU = 2 * Math.PI;

export const key = (lines) => lines.map((x) => String(x | 0)).join("");

export function linesOf(data, number) {
  for (const e of Object.values(data)) if (e.number === number) return e.lines.map((x) => x | 0);
  return [];
}

export function flip(lines, n) {
  const out = lines.slice();
  out[n - 1] = 1 - out[n - 1];
  return out;
}

// 辯位: the first and top lines have no fixed yin or yang place; 3 and 5 are yang places, 2 and 4 yin.
export function place(lines, n) {
  if (n === 1 || n === 6) return "NO FIXED PLACE";
  return lines[n - 1] === n % 2 ? "CORRECT" : "NOT CORRECT";
}

export const isCentre = (n) => n === 2 || n === 5;
export const partner = (n) => (n <= 3 ? n + 3 : n - 3);
export const answers = (lines, n) => lines[n - 1] !== lines[partner(n) - 1];

export function logRow(lines, n) {
  const parts = [`L${n}`, lines[n - 1] === 1 ? "YANG" : "YIN ", place(lines, n)];
  if (isCentre(n)) parts.push("CENTRE");
  if (answers(lines, n)) parts.push(`ANSWERS L${partner(n)}`);
  return parts.join("  ");
}

export const title = (e) => `${e.number}  ${e.zh} ${e.pinyin.toUpperCase()}  ${e.name}`;

export const trigramRows = (e) => ["upper", "lower"].map((side) => `${side.toUpperCase()}  ${e[side].zh} ${e[side].name}, ${e[side].does}`);

export const masterLines = (e) => e.masters.map((m) => m.line);

export function wangbiRows(e) {
  const out = e.masters.map((m) => `L${m.line}  ${m.zh}  ${m.en}`);
  return out.length ? out : [NO_MASTER];
}

// The next whole turn from any angle, so an interrupted turn still ends square to the viewer.
export const turnTarget = (turn) => (Math.floor(turn / TAU + 1e-6) + 1) * TAU;

// The nearest whole turn, forward or back: where a drag settles when released. GDScript's
// round() rounds halves away from zero, which Math.round does for positive angles only.
export const nearestSquare = (turn) => Math.sign(turn) * Math.round(Math.abs(turn) / TAU) * TAU;
