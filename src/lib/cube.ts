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

// The cube drawn in 3D: each line pushes its corner out along one of the icosahedron's six
// axes (+ solid, - broken), so the 64 corners spread evenly with none on top of another; then
// turned so Qian (63) is straight up and Kun (0) straight down.
const PHI = (1 + Math.sqrt(5)) / 2;
const AXES: number[][] = [
  [0, 1, PHI],
  [0, -1, PHI],
  [1, PHI, 0],
  [-1, PHI, 0],
  [PHI, 0, 1],
  [-PHI, 0, 1],
].map(([x, y, z]) => {
  const n = Math.hypot(x, y, z);
  return [x / n, y / n, z / n];
});
const raw = (v: number) => AXES.reduce<number[]>((p, a, i) => p.map((c, k) => c + (v & (32 >> i) ? 0.5 : -0.5) * a[k]), [0, 0, 0]);
// The rotation taking unit vector `u` to +z (Rodrigues).
const toUp = (u: number[]) => {
  const [x, y, z] = u;
  const s = Math.hypot(x, y);
  if (s < 1e-12) return (p: number[]) => (z > 0 ? p : [p[0], -p[1], -p[2]]);
  const [kx, ky] = [y / s, -x / s];
  const c = z;
  return ([px, py, pz]: number[]) => {
    const dot = kx * px + ky * py;
    const cross = [ky * pz, -kx * pz, kx * py - ky * px];
    return [px * c + cross[0] * s + kx * dot * (1 - c), py * c + cross[1] * s + ky * dot * (1 - c), pz * c + cross[2] * s];
  };
};
export const corners = () => {
  const q = raw(63);
  const n = Math.hypot(...q);
  const turn = toUp(q.map((c) => c / n));
  return [...Array(64).keys()].map((v) => turn(raw(v)) as [number, number, number]);
};

// A clip's scene for scripts/hypercube.mjs: one corner lit with its neighbours, or a path
// lit one edge at a time, the first at `at` seconds and then every `gap`.
export type CubeScene = { focus?: number; path?: number[]; at?: number; gap?: number; secs?: number };
export const pathTimes = (s: CubeScene) => (s.path ?? []).slice(1).map((_, k) => (s.at ?? 0) + k * (s.gap ?? 1));
