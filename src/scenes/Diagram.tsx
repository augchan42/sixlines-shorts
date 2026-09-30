import { Easing, Img, interpolate, staticFile } from "remotion";
import { fonts } from "../lib/fonts";
import { bitsOf, linesOf, ringAngle, squareCell } from "../lib/diagram";
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
  const s = 0.62;
  return linesOf(v).flatMap((l, i) => {
    const y = cy + (i - 2.5) * GAP * 0.8 * s;
    return bars(l).map(([u0, u1]): V[] => [[cx + u0 * s, y - (THICK / 2) * s, 0], [cx + u1 * s, y - (THICK / 2) * s, 0], [cx + u1 * s, y + (THICK / 2) * s, 0], [cx + u0 * s, y + (THICK / 2) * s, 0]]);
  });
};

// The count's position on the ring as a continuous value: 0..31 up the right half.
const countAngle = (c: number) => (31.5 - c) * (360 / 64);

// The camera for a page that counts: from high over the whole ring, printed way up, down to
// the ring beside Kun, turned to look outward; then along the ring with the count.
export const countCam = (sec: number, o: { count: [number, number]; at: number; secs: number }): { cam: Cam; c: number } => {
  const c = interpolate(sec, [o.at, o.at + o.secs], o.count, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const down = interpolate(sec, [0.5, o.at], [0, 1], ease);
  const deg = countAngle(c);
  const on = ringPoint(deg, R + 2.5);
  const glide: Cam = { target: on, dist: 16, az: -deg, el: 32 };
  const high: Cam = { target: [0, 0, 0], dist: 150, az: 0, el: 80 };
  const mix = (a: number, b: number) => a + (b - a) * down;
  return {
    c,
    cam: {
      target: [mix(high.target[0], glide.target[0]), mix(high.target[1], glide.target[1]), 0],
      dist: mix(high.dist, glide.dist),
      az: mix(high.az, glide.az),
      el: mix(high.el, glide.el),
    },
  };
};

const path = (pts: (readonly [number, number, number])[]) => `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L")}Z`;

export const Wireframe: React.FC<{ cam: Cam; amber?: number; reached?: number; square?: number }> = ({ cam, amber, reached, square = 0.22 }) => {
  const at = project(cam, 1400, CX, CY);
  const drawHex = (v: number, quads: V[][], colour: string, opacity: number) => {
    const pts = quads.map((q) => q.map(at));
    // Anything behind or right beside the camera is left out.
    if (pts.some((q) => q.some((p) => p[2] < 2))) return null;
    return <path key={v} d={pts.map(path).join("")} stroke={colour} opacity={opacity} />;
  };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <clipPath id="diagram-clip">
        <rect x={WINDOW.x} y={WINDOW.y} width={WINDOW.w} height={WINDOW.h} />
      </clipPath>
      <g fill="none" strokeWidth={2.2} clipPath="url(#diagram-clip)" style={{ filter: `drop-shadow(0 0 5px ${PHOSPHOR})` }}>
        {square > 0 && [...Array(64).keys()].map((v) => drawHex(v, squareBars(v), PHOSPHOR, square))}
        {[...Array(64).keys()].map((v) => {
          const lit = reached === undefined || (v < 32 ? v <= reached : false);
          return drawHex(v, ringBars(v), v === amber ? AMBER : PHOSPHOR, v === amber || lit ? 1 : 0.3);
        })}
      </g>
    </svg>
  );
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
export const Plate: React.FC<{ src: string; sec: number; secs: number; zoom?: [number, number]; at?: [[number, number], [number, number]]; opacity?: number }> = ({ src, sec, secs, zoom = [1, 1.12], at = [[0.5, 0.5], [0.5, 0.5]], opacity = 1 }) => {
  const k = interpolate(sec, [0, secs], [0, 1], ease);
  const z = zoom[0] + (zoom[1] - zoom[0]) * k;
  const [fx, fy] = [at[0][0] + (at[1][0] - at[0][0]) * k, at[0][1] + (at[1][1] - at[0][1]) * k];
  const w = 900;
  const h = (w * 1262) / 1313;
  return (
    <div style={{ position: "absolute", left: WINDOW.x, top: WINDOW.y, width: WINDOW.w, height: WINDOW.h, overflow: "hidden", opacity }}>
      <div style={{ position: "absolute", left: WINDOW.w / 2 - w / 2, top: WINDOW.h / 2 - h / 2 + 20, width: w, height: h, transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${z})` }}>
        <Img src={staticFile(src)} style={{ width: w, height: h, filter: "grayscale(1) invert(1) contrast(1.7) brightness(0.85)" }} />
        <div style={{ position: "absolute", inset: 0, background: PHOSPHOR, mixBlendMode: "multiply" }} />
        <div style={{ position: "absolute", inset: 0, border: `2px solid ${DIM}` }} />
      </div>
    </div>
  );
};
