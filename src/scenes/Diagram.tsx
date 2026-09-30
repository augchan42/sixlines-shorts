import { Easing, Img, interpolate, staticFile } from "remotion";
import { fonts } from "../lib/fonts";
import { bitsOf, linesOf, ringAngle, squareCell, treeNode } from "../lib/diagram";
import { project, type Cam, type V } from "./Flight";
import { DIM, glow, PHOSPHOR } from "./Readout";

// The diagram Bouvet sent Leibniz, two ways (docs/superpowers/specs/2026-09-30-leibniz-diagram-design.md):
// the plate, the scan itself tinted to the screen's green; and the wireframe, the same ring and
// square rebuilt from the hexagrams' values, which the flight camera moves through.
//
// World units on the floor: x east, y north (the top of the woodcut), z up. The ring's hexagrams
// stand with their bottom line toward the centre, as printed.

const AMBER = "#ffb347";
const R = 40; // the ring's inner radius
const GAP = 1; // from one line to the next
const HALF = 1.4; // half a line's length
const THICK = 0.45;
const SQUARE = 25; // the square's half side
const ease = { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// The drawing's window on the screen, under the query and answer.
export const WINDOW = { x: 50, y: 560, w: 980, h: 1160 };
const CX = 540;
const CY = 1110;

// A line's rectangles (one solid, two broken) in the hexagram's own frame: u along the line,
// v across it.
const bars = (l: 0 | 1): [number, number][] => (l ? [[-HALF, HALF]] : [[-HALF, -0.25], [0.25, HALF]]);

const ringPoint = (deg: number, r: number): V => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), r * Math.cos(a), 0];
};

// The outline of each bar of hexagram `v` on the ring, as floor points.
const ringBars = (v: number) => {
  const a = (ringAngle(v) * Math.PI) / 180;
  const out: V = [Math.sin(a), Math.cos(a), 0];
  const along: V = [Math.cos(a), -Math.sin(a), 0];
  const at = (u: number, r: number): V => [out[0] * r + along[0] * u, out[1] * r + along[1] * u, 0];
  return linesOf(v).flatMap((l, i) => {
    const r = R + i * GAP;
    return bars(l).map(([u0, u1]) => [at(u0, r - THICK / 2), at(u1, r - THICK / 2), at(u1, r + THICK / 2), at(u0, r + THICK / 2)]);
  });
};

// Hexagram `v` in the square: a column of six lines, bottom line lowest, as printed.
const squareBars = (v: number) => {
  const { row, col } = squareCell(v);
  const cell = (2 * SQUARE) / 8;
  const [cx, cy] = [-SQUARE + cell * (col + 0.5), SQUARE - cell * (row + 0.5)];
  const s = 1;
  return linesOf(v).flatMap((l, i) => {
    const y = cy + (i - 2.5) * GAP * 0.72 * s;
    return bars(l).map(([u0, u1]): V[] => [[cx + u0 * s, y - (THICK / 2) * s, 0], [cx + u1 * s, y - (THICK / 2) * s, 0], [cx + u1 * s, y + (THICK / 2) * s, 0], [cx + u0 * s, y + (THICK / 2) * s, 0]]);
  });
};

// High over the whole ring, printed way up (Qian at the top).
const HIGH: Cam = { target: [0, 0, 0], dist: 150, az: 0, el: 80 };
const mixCam = (a: Cam, b: Cam, k: number): Cam => ({
  target: [a.target[0] + (b.target[0] - a.target[0]) * k, a.target[1] + (b.target[1] - a.target[1]) * k, 0],
  dist: a.dist + (b.dist - a.dist) * k,
  az: a.az + (b.az - a.az) * k,
  el: a.el + (b.el - a.el) * k,
});

// The camera for a page that counts: from high over the ring down to where the count starts,
// turned to look outward, then along the ring with the count (a continuous value, `c`). The
// counter, the amber hexagram and the camera all run off `c`.
export const countCam = (sec: number, o: { count: [number, number]; at: number; secs: number }): { cam: Cam; c: number } => {
  const c = interpolate(sec, [o.at, o.at + o.secs], o.count, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const down = interpolate(sec, [0.5, o.at], [0, 1], ease);
  const deg = ringAngle(c);
  const glide: Cam = { target: ringPoint(deg, R + 2.5), dist: 16, az: -deg, el: 32 };
  return { c, cam: mixCam(HIGH, glide, down) };
};

const path = (pts: (readonly [number, number, number])[]) => `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L")}Z`;

// Each hexagram's colour and opacity, on the ring and in the square.
type Style = (v: number) => [string, number];
const lit: Style = () => [PHOSPHOR, 1];

export const Wireframe: React.FC<{ cam: Cam; ring?: Style; square?: Style; cx?: number; cy?: number; opacity?: number }> = ({ cam, ring = lit, square = () => [PHOSPHOR, 0.22], cx = CX, cy = CY, opacity = 1 }) => {
  const at = project(cam, 1400, cx, cy);
  const drawHex = (key: string, quads: V[][], [colour, o]: [string, number]) => {
    if (o <= 0) return null;
    const pts = quads.map((q) => q.map(at));
    // Anything behind or right beside the camera is left out.
    if (pts.some((q) => q.some((p) => p[2] < 2))) return null;
    return <path key={key} d={pts.map(path).join("")} stroke={colour} opacity={o} />;
  };
  const all = [...Array(64).keys()];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity }}>
      <clipPath id="diagram-clip">
        <rect x={WINDOW.x} y={WINDOW.y} width={WINDOW.w} height={WINDOW.h} />
      </clipPath>
      <g fill="none" strokeWidth={2.2} clipPath="url(#diagram-clip)" style={{ filter: `drop-shadow(0 0 5px ${PHOSPHOR})` }}>
        {all.map((v) => drawHex(`s${v}`, squareBars(v), square(v)))}
        {all.map((v) => drawHex(`r${v}`, ringBars(v), ring(v)))}
      </g>
    </svg>
  );
};

// One hexagram flat on the screen: its lines as outlined bars, bottom line lowest. `lines` may be
// fewer than six (a node of the doubling tree). Centred on (x, y), `w` wide, turned `rot` degrees.
const FlatHex: React.FC<{ lines: (0 | 1)[]; x: number; y: number; w: number; rot?: number; colour?: string; opacity?: number; fill?: boolean }> = ({ lines, x, y, w, rot = 0, colour = PHOSPHOR, opacity = 1, fill }) => {
  const th = w * 0.09;
  const gap = w * 0.17;
  const n = lines.length;
  return (
    <g transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot.toFixed(2)})`} opacity={opacity}>
      {lines.flatMap((l, i) => {
        const yy = ((n - 1) / 2 - i) * gap - th / 2;
        return (l ? [[-w / 2, w / 2]] : [[-w / 2, -w * 0.09], [w * 0.09, w / 2]]).map(([a, b], j) => (
          <rect key={`${i}-${j}`} x={a} y={yy} width={b - a} height={th} stroke={colour} fill={fill ? colour : "none"} fillOpacity={0.25} />
        ));
      })}
    </g>
  );
};

// One hexagram lifted out large: its bits on the left, and with `weights` each line's worth on
// the right, 32 at the bottom to 1 at the top (Leibniz's reading). It rises in over `rise`.
const LIFT = { x: 500, y: 1080, w: 380 };
const BigHex: React.FC<{ v: number; sec: number; from: number; weights?: boolean }> = ({ v, sec, from, weights }) => {
  const k = interpolate(sec, [from, from + 1.2], [0, 1], ease);
  const labels = interpolate(sec, [from + 1.2, from + 1.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const gap = LIFT.w * 0.17;
  const y = LIFT.y + 60 * (1 - k);
  const lineY = (i: number) => y + (2.5 - i) * gap;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g strokeWidth={3} style={{ filter: `drop-shadow(0 0 8px ${AMBER})` }}>
          <FlatHex lines={linesOf(v)} x={LIFT.x} y={y} w={LIFT.w} colour={AMBER} opacity={k} />
        </g>
      </svg>
      {linesOf(v).map((l, i) => (
        <div key={i} style={{ position: "absolute", top: lineY(i) - 30, left: 0, width: LIFT.x - LIFT.w / 2 - 50, textAlign: "right", opacity: labels, fontFamily: fonts.pixel, fontSize: 48, color: AMBER, textShadow: `0 0 10px ${AMBER}` }}>
          {l}
        </div>
      ))}
      {weights &&
        linesOf(v).map((_, i) => (
          <div key={i} style={{ position: "absolute", top: lineY(i) - 26, left: LIFT.x + LIFT.w / 2 + 50, opacity: labels, fontFamily: fonts.pixel, fontSize: 40, color: PHOSPHOR, textShadow: glow }}>
            {`x${2 ** (5 - i)}`}
          </div>
        ))}
    </>
  );
};

// The doubling tree: from one line of light, each stage splits every pattern in two, a broken
// line added on the left and a solid on the right, until 64 stand in a row, 0 on the left. With
// `morph`, the row then splits in two groups of 32 and each bends up its half of the ring.
const TREE = { left: 90, width: 900, top: 650, step: 140 };
const RING2D = { cx: 540, cy: 1130, r: 380 };
export const treeAt = (depth: number, k: number) => {
  const spacing = TREE.width / 2 ** depth;
  return { x: TREE.left + spacing * (k + 0.5), y: TREE.top + depth * TREE.step, w: Math.min(70, spacing * 0.72) };
};
const Tree: React.FC<{ sec: number; start: number; stage: number; morph?: number; dim?: number }> = ({ sec, start, stage, morph, dim = 1 }) => {
  const shown = (d: number) => interpolate(sec, [start + d * stage, start + d * stage + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const m = morph === undefined ? 0 : interpolate(sec, [morph, morph + 3], [0, 1], ease);
  const nodes = [];
  for (let d = 0; d <= 6; d++)
    for (let k = 0; k < 2 ** d; k++) {
      const p = treeAt(d, k);
      const o = shown(d) * (d < 6 ? 1 - m : 1);
      const branch = shown(d) * (1 - m);
      if (o <= 0 && branch <= 0) continue;
      if (d > 0) {
        const q = treeAt(d - 1, k >> 1);
        nodes.push(<path key={`b${d}-${k}`} d={`M${q.x},${q.y + 20}L${p.x},${p.y - 26}`} stroke={DIM} strokeWidth={1.5} opacity={branch * 0.6} />);
      }
      if (d === 0) {
        nodes.push(<rect key="root" x={p.x - 35} y={p.y - 3} width={70} height={6} stroke={PHOSPHOR} fill="none" opacity={o} />);
        continue;
      }
      if (d === 6 && m > 0) {
        const deg = ringAngle(k);
        const a = (deg * Math.PI) / 180;
        const r = { x: RING2D.cx + RING2D.r * Math.sin(a), y: RING2D.cy - RING2D.r * Math.cos(a) };
        nodes.push(<FlatHex key={`n${k}`} lines={treeNode(6, k)} x={p.x + (r.x - p.x) * m} y={p.y + (r.y - p.y) * m} w={p.w + (26 - p.w) * m} rot={deg * m} opacity={o} />);
        continue;
      }
      nodes.push(<FlatHex key={`n${d}-${k}`} lines={treeNode(d, k)} x={p.x} y={p.y} w={p.w} opacity={o} />);
    }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: dim }}>
      <g fill="none" strokeWidth={1.6} stroke={PHOSPHOR} style={{ filter: `drop-shadow(0 0 4px ${PHOSPHOR})` }}>
        {nodes}
      </g>
    </svg>
  );
};

const TRIGRAM: Record<number, [string, string]> = { 0: ["地", "EARTH"], 1: ["山", "MOUNTAIN"], 2: ["水", "WATER"], 3: ["風", "WIND"], 4: ["雷", "THUNDER"], 5: ["火", "FIRE"], 6: ["澤", "LAKE"], 7: ["天", "HEAVEN"] };
const Label: React.FC<{ top: number; text: string; opacity: number; colour?: string; size?: number }> = ({ top, text, opacity, colour = PHOSPHOR, size = 40 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", opacity, fontFamily: fonts.pixel, fontSize: size, color: colour, textShadow: colour === AMBER ? `0 0 12px ${AMBER}` : glow }}>
    {text}
  </div>
);

export type DiagramShow = {
  // "count": fly the ring while the counter runs; "overview": the whole ring from above, turning
  // slowly; "bits": one hexagram lifted out (with `fadePlate`, the scan fades to the ring first);
  // "tree": the doubling tree; "square": down into the square, a row then a column in amber;
  // "pair": the scan above, the ring below, both dim.
  kind?: "count" | "overview" | "bits" | "tree" | "square" | "pair";
  count?: [number, number];
  at?: number;
  secs?: number;
  // The value the counter shows while the camera comes down, before the count starts.
  before?: number;
  v?: number;
  weights?: boolean;
  fadePlate?: boolean;
  morph?: number;
  dim?: number;
  row?: number;
  col?: number;
};

const fade = (sec: number, from: number, len = 0.6) => interpolate(sec, [from, from + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const DiagramPage: React.FC<{ d: DiagramShow; sec: number; secs: number; plate?: string; names?: Record<string, { zh: string; name: string }> }> = ({ d, sec, secs, plate, names }) => {
  const kind = d.kind ?? "count";
  const turning: Cam = { ...HIGH, az: 1.5 * sec };
  if (kind === "count" && d.count) {
    const at = d.at ?? 5;
    const { cam, c } = countCam(sec, { count: d.count, at, secs: d.secs ?? 10 });
    const counting = sec >= at - 0.3;
    const v = counting ? Math.round(c) : d.before;
    const reached = counting ? Math.round(c) : d.before ?? 63;
    return (
      <>
        <Wireframe cam={cam} ring={(x) => (x === v && counting ? [AMBER, 1] : [PHOSPHOR, x <= reached ? 1 : 0.3])} />
        {v !== undefined && <Counter v={v} name={names?.[v]} />}
      </>
    );
  }
  if (kind === "overview") {
    return <Wireframe cam={turning} ring={(x) => (x === d.v ? [AMBER, 1] : [PHOSPHOR, 1])} />;
  }
  if (kind === "bits" && d.v !== undefined) {
    const from = d.fadePlate ? 1.4 : 0.2;
    return (
      <>
        {d.fadePlate && plate && <Plate src={plate} sec={0} secs={1} zoom={[1, 1]} opacity={1 - fade(sec, 0.2, 1.2)} />}
        <Wireframe cam={turning} ring={(x) => (x === d.v ? [AMBER, 1] : [PHOSPHOR, 1])} opacity={0.3 * fade(sec, d.fadePlate ? 0.8 : 0, 1)} />
        <BigHex v={d.v} sec={sec} from={from} weights={d.weights} />
        {sec >= from + 2.2 && <Counter v={d.v} name={names?.[d.v]} />}
      </>
    );
  }
  if (kind === "tree") return <Tree sec={sec} start={d.at ?? 1} stage={0.9} morph={d.morph} dim={d.dim} />;
  if (kind === "square") {
    const row = d.row ?? 2;
    const col = d.col ?? 5;
    const at = d.at ?? 3;
    const down = interpolate(sec, [0.3, at], [0, 1], ease);
    const cam = mixCam(HIGH, { target: [0, 0, 0], dist: 85, az: 0, el: 72 }, down);
    const [r, c, both] = [fade(sec, at + 0.5), fade(sec, at + 3), fade(sec, at + 5.5)];
    const v = row * 8 + col;
    const style: Style = (x) => {
      const { row: xr, col: xc } = squareCell(x);
      if (x === v && both > 0) return [AMBER, 1];
      const on = (xr === row && r > 0 && both === 0) || (xc === col && c > 0 && both === 0);
      return on ? [AMBER, 1] : [PHOSPHOR, 0.8];
    };
    return (
      <>
        <Wireframe cam={cam} ring={() => [PHOSPHOR, 1 - 0.75 * down]} square={style} />
        <Label top={1560} text={`ROW: LOWER ${TRIGRAM[row][0]} ${TRIGRAM[row][1]}`} opacity={r} />
        <Label top={1610} text={`COLUMN: UPPER ${TRIGRAM[col][0]} ${TRIGRAM[col][1]}`} opacity={c} />
        {names?.[v] && <Label top={1660} text={`${names[v].zh} ${names[v].name.toUpperCase()}`} opacity={both} colour={AMBER} />}
      </>
    );
  }
  if (kind === "pair") {
    return (
      <>
        {plate && <Plate src={plate} sec={sec} secs={secs} zoom={[0.58, 0.6]} at={[[0.5, 0.02], [0.5, 0.02]]} opacity={0.55} />}
        <Wireframe cam={{ ...HIGH, dist: 270 }} cy={1450} opacity={0.55} />
      </>
    );
  }
  return null;
};

// The counter under the flight: the hexagram's lines as bits, bottom line first, and its value;
// then its name, Chinese with English beside it.
export const Counter: React.FC<{ v: number; name?: { zh: string; name: string } }> = ({ v, name }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 1500, textAlign: "center" }}>
    <div style={{ fontFamily: fonts.pixel, fontSize: 92, color: AMBER, textShadow: `0 0 14px ${AMBER}` }}>{`${bitsOf(v)} = ${v}`}</div>
    {name && <div style={{ fontFamily: fonts.pixel, fontSize: 40, color: PHOSPHOR, textShadow: glow, marginTop: 10 }}>{`${name.zh} ${name.name.toUpperCase()}`}</div>}
  </div>
);

// The scan, 1313x1262, shown 900 wide in the window and pushed in slowly: `zoom` from and to,
// about `at` (fractions of the scan, from and to). Ink turns to light: inverted, then tinted.
// `marks` outline the ring, then the square, in amber from the page's second given, over the scan
// (in its own pixels, so they push in with it).
// `digits`: Leibniz's 4 5 6 7 over the square's top row (豫 晉 萃 否, values 4 to 7), ringed, on
// the page about his numerals; the scan is shown softer there so the faint digits stay.
export type PlateMarks = { ring?: number; square?: number; digits?: number };
export const PLATE_DIGITS = [[678, 272], [765, 276], [860, 272], [958, 272]];
export const PLATE_RING = { cx: 657, cy: 646, r: 545 };
export const PLATE_SQUARE = { x: 300, y: 262, w: 750, h: 684 };
const fadeIn = (sec: number, from?: number) => (from === undefined ? 0 : interpolate(sec, [from, from + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
export const Plate: React.FC<{ src: string; sec: number; secs: number; zoom?: [number, number]; at?: [[number, number], [number, number]]; opacity?: number; marks?: PlateMarks }> = ({ src, sec, secs, zoom = [1, 1.12], at = [[0.5, 0.5], [0.5, 0.5]], opacity = 1, marks = {} }) => {
  const k = interpolate(sec, [0, secs], [0, 1], ease);
  const z = zoom[0] + (zoom[1] - zoom[0]) * k;
  const [fx, fy] = [at[0][0] + (at[1][0] - at[0][0]) * k, at[0][1] + (at[1][1] - at[0][1]) * k];
  const w = 900;
  const h = (w * 1262) / 1313;
  return (
    <div style={{ position: "absolute", left: WINDOW.x, top: WINDOW.y, width: WINDOW.w, height: WINDOW.h, overflow: "hidden", opacity }}>
      <div style={{ position: "absolute", left: WINDOW.w / 2 - w / 2, top: WINDOW.h / 2 - h / 2 + 20, width: w, height: h, transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${z})` }}>
        <Img src={staticFile(src)} style={{ width: w, height: h, filter: marks.digits === undefined ? "grayscale(1) invert(1) contrast(1.7) brightness(0.85)" : "grayscale(1) invert(1) contrast(1.15) brightness(1.1)" }} />
        <div style={{ position: "absolute", inset: 0, background: PHOSPHOR, mixBlendMode: "multiply" }} />
        <div style={{ position: "absolute", inset: 0, border: `2px solid ${DIM}` }} />
        <svg viewBox="0 0 1313 1262" style={{ position: "absolute", inset: 0, width: w, height: h }} fill="none" strokeWidth={6}>
          {/* The ring's band of hexagrams, then the square; the ring dims as the square lights. */}
          <circle cx={PLATE_RING.cx} cy={PLATE_RING.cy} r={PLATE_RING.r} stroke={AMBER} opacity={fadeIn(sec, marks.ring) * (1 - 0.6 * fadeIn(sec, marks.square))} style={{ filter: `drop-shadow(0 0 8px ${AMBER})` }} />
          <rect x={PLATE_SQUARE.x} y={PLATE_SQUARE.y} width={PLATE_SQUARE.w} height={PLATE_SQUARE.h} stroke={AMBER} opacity={fadeIn(sec, marks.square)} style={{ filter: `drop-shadow(0 0 8px ${AMBER})` }} />
          {PLATE_DIGITS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={26} stroke={AMBER} strokeWidth={4} opacity={fadeIn(sec, marks.digits === undefined ? undefined : marks.digits + i * 0.3)} style={{ filter: `drop-shadow(0 0 6px ${AMBER})` }} />
          ))}
        </svg>
      </div>
    </div>
  );
};
