import { Easing, interpolate } from "remotion";
import { DEPTH, LINE_H, lineZ, PHOSPHOR, slabsOf } from "./Readout";

// The hexagram as a place the view moves through, after the Nostromo's landing graphics in
// Alien (Alan Sutcliffe's terrain, the orbit plot): approach it while its lines are plotted,
// go down to the line the page is about, then circle slowly. See
// docs/research/2026-09-27-nostromo-screens.md. Calm: eased, no shake.
//
// World units as the plot's: x across a line, y into the screen, z up the stack.

type V = [number, number, number];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V): V => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// A camera `dist` from `target`, `az` degrees round it and `el` degrees above it.
export type Cam = { target: V; dist: number; az: number; el: number };

const project = (cam: Cam, focal: number, cx: number, cy: number) => {
  const r = (Math.PI / 180);
  const pos: V = [
    cam.target[0] + cam.dist * Math.sin(cam.az * r) * Math.cos(cam.el * r),
    cam.target[1] - cam.dist * Math.cos(cam.az * r) * Math.cos(cam.el * r),
    cam.target[2] + cam.dist * Math.sin(cam.el * r),
  ];
  const f = norm(sub(cam.target, pos));
  const right = norm(cross(f, [0, 0, 1]));
  const up = cross(right, f);
  return (p: V) => {
    const d = sub(p, pos);
    const z = Math.max(0.3, dot(d, f));
    return [cx + (focal * dot(d, right)) / z, cy - (focal * dot(d, up)) / z, z] as const;
  };
};

const EDGES = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

// The camera at `sec` seconds into a page: from far off to `near` while the lines plot
// (0..approach), then down to line `to` from `descendAt` over 4 s, then a slow circle.
export const flightCam = (sec: number, o: { approach: number; descendAt: number; to?: number; end: number }): Cam => {
  const ease = { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const lin = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const come = interpolate(sec, [0, o.approach + 2], [0, 1], ease);
  const down = o.to === undefined ? 0 : interpolate(sec, [o.descendAt, o.descendAt + 4], [0, 1], ease);
  const z = o.to === undefined ? 0 : lineZ(o.to);
  return {
    target: [0, 0, z * down],
    dist: interpolate(come, [0, 1], [70, 16]) - 4.5 * down,
    az: interpolate(come, [0, 1], [-40, -18]) + interpolate(sec, [o.descendAt, o.end], [0, 30], lin),
    el: interpolate(come, [0, 1], [24, 12]) - 5 * down,
  };
};

// How far the camera has gone down to its line, 0..1: the log fades as it does.
export const descended = (sec: number, descendAt: number) => interpolate(sec, [descendAt, descendAt + 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// The hexagram's lines seen from `cam`: `drawn` 0..1 plots them bottom first.
export const FlightPlot: React.FC<{ lines: (0 | 1)[]; cam: Cam; drawn: number; lit?: number[]; amber?: number[]; cx: number; cy: number }> = ({ lines, cam, drawn, lit, amber = [], cx, cy }) => {
  const at = project(cam, 1400, cx, cy);
  return (
    <g fill="none" strokeWidth={2.6} clipPath="url(#flight-clip)">
      <clipPath id="flight-clip">
        <rect x={50} y={560} width={980} height={1160} />
      </clipPath>
      {slabsOf(lines).map((s, k) => {
        const d = Math.min(1, Math.max(0, drawn * 6 - s.i));
        if (d <= 0) return null;
        const corners: V[] = [s.x0, s.x1].flatMap((x) => [-DEPTH / 2, DEPTH / 2].flatMap((y) => [s.z - LINE_H / 2, s.z + LINE_H / 2].map((z) => [x, y, z] as V)));
        const p = corners.map(at);
        const path = EDGES.map(([a, b]) => `M${p[a][0].toFixed(1)},${p[a][1].toFixed(1)}L${p[b][0].toFixed(1)},${p[b][1].toFixed(1)}`).join("");
        const on = !lit || lit.includes(s.i) || amber.includes(s.i);
        const colour = amber.includes(s.i) ? "#ffb347" : PHOSPHOR;
        return <path key={k} d={path} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - d} stroke={colour} opacity={on ? 1 : 0.22} style={{ filter: `drop-shadow(0 0 6px ${colour})` }} />;
      })}
    </g>
  );
};
