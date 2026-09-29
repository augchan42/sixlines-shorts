// The Wuyue video's map: the coast of China, Korea and Japan, Wuyue's border and the places the
// video names, projected to metres on the scene's floor with Hangzhou at the origin. The user,
// 2026-09-29: "whats missing is a sense of geography because there's no map".
//
//   node scripts/wuyue-map.mjs     # writes series/wuyue-map.json
//
// The coast is Natural Earth's 1:50m coastline (public domain), fetched and checked against its
// hash, cropped to East Asia and simplified. The projection is equirectangular, a degree of
// longitude shortened by the cosine of the map's middle latitude, which is close enough at this
// size. Wuyue's border is approximate: the inland edge of its thirteen prefectures in 978 (all
// of modern Zhejiang, with Suzhou and Jiaxing), from the Yangtze's south bank round to the
// coast below Wenzhou; the coast closes it. Fuzhou, held from 947, is left out.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const SOURCE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_coastline.geojson";
const SHA256 = "271f1c4c1908312bac6b29d158ea1356544beafc129f260005300913aa5ea283";

export const HANGZHOU = [120.16, 30.27];
const MID_LAT = 33;
// Metres a degree of latitude. A character is about 10 m wide.
export const SCALE = 6;
// What the map covers, in degrees: [west, south, east, north]; more than the vertical cut shows.
const BOX = [96, 4, 152, 58];

export const PLACES = {
  // The 吳越 sign stands in the middle of the kingdom (27.1° to 31.7° N, 118.1° to 122° E), not on
  // Hangzhou at its north-east corner: the sign names the kingdom. It is 0.4° north of the middle
  // so the WUYUE under it clears the border's south end.
  wuyue: { name: "Wuyue, its middle", at: [120.05, 29.8] },
  korea: { name: "Kaesong, Goryeo's capital", at: [126.55, 37.97] },
  japan: { name: "Dazaifu, Kyushu: Japan's office for the continent", at: [130.52, 33.51] },
  north: { name: "Kaifeng, the northern courts' capital", at: [114.35, 34.8] },
};

// Wuyue's inland border, north to south (lon, lat).
export const BORDER = [
  [121.05, 31.72], [120.45, 31.72], [120.3, 31.45], [120.0, 31.3], [119.6, 31.15], [119.35, 30.9], [119.2, 30.55],
  [118.85, 30.3], [118.4, 29.8], [118.1, 29.4], [118.2, 28.95], [118.35, 28.5], [118.6, 28.2], [118.9, 27.8],
  [119.5, 27.6], [120.0, 27.4], [120.35, 27.15], [120.5, 27.08],
];

export const project = ([lon, lat], scale = SCALE) => [
  +((lon - HANGZHOU[0]) * Math.cos((MID_LAT * Math.PI) / 180) * scale).toFixed(3) || 0,
  +((lat - HANGZHOU[1]) * scale).toFixed(3) || 0,
];

const inside = ([x, y], [w, s, e, n]) => x >= w && x <= e && y >= s && y <= n;

// The parts of a line inside the box, split where it leaves.
export const clip = (line, box) => {
  const parts = [];
  let cur = [];
  for (const p of line) {
    if (inside(p, box)) cur.push(p);
    else if (cur.length) (parts.push(cur), (cur = []));
  }
  if (cur.length) parts.push(cur);
  return parts.filter((p) => p.length > 1);
};

// Douglas–Peucker: drop points closer than `tol` to the line through their neighbours.
export const simplify = (line, tol) => {
  if (line.length < 3) return line;
  const [a, b] = [line[0], line.at(-1)];
  // An island ends where it starts, so there is no chord to measure from: split it at the point
  // farthest from the start and simplify the two halves.
  if (a[0] === b[0] && a[1] === b[1]) {
    const d = line.map((p) => Math.hypot(p[0] - a[0], p[1] - a[1]));
    const at = d.indexOf(Math.max(...d));
    if (at === 0) return [a];
    return [...simplify(line.slice(0, at + 1), tol).slice(0, -1), ...simplify(line.slice(at), tol)];
  }
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dy) || 1;
  let far = 0;
  let at = 0;
  for (let i = 1; i < line.length - 1; i++) {
    const d = Math.abs(dy * (line[i][0] - a[0]) - dx * (line[i][1] - a[1])) / len;
    if (d > far) (far = d), (at = i);
  }
  if (far <= tol) return [a, b];
  return [...simplify(line.slice(0, at + 1), tol).slice(0, -1), ...simplify(line.slice(at), tol)];
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const res = await fetch(SOURCE);
  const body = Buffer.from(await res.arrayBuffer());
  const hash = createHash("sha256").update(body).digest("hex");
  if (hash !== SHA256) throw new Error(`coastline hash ${hash}, expected ${SHA256}`);
  const lines = JSON.parse(body).features.flatMap((f) => (f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates));
  const coast = lines
    .flatMap((l) => clip(l, BOX))
    .map((l) => simplify(l, 0.03))
    .filter((l) => l.length > 2)
    .map((l) => l.map((p) => project(p)));
  const out = {
    about: "Written by scripts/wuyue-map.mjs. Metres on the floor, Hangzhou at the origin, x east, y north. The border is open: the coast closes it.",
    source: { coast: SOURCE, sha256: SHA256, licence: "Natural Earth, public domain" },
    scale: SCALE,
    places: Object.fromEntries(Object.entries(PLACES).map(([k, p]) => [k, { ...p, xy: project(p.at) }])),
    border: BORDER.map((p) => project(p)),
    coast,
  };
  const file = path.join(root, "series/wuyue-map.json");
  writeFileSync(file, JSON.stringify(out));
  console.log(`wrote ${path.relative(root, file)}: ${coast.length} coast lines, ${coast.reduce((n, l) => n + l.length, 0)} points`);
}
