// A character's older forms (series/forms/<char>.json: public-domain SVGs from Wikimedia
// Commons' Ancient Chinese Characters Project) as stroke data blender/forms.py can trace in
// neon, like the kaishu from Make Me a Hanzi (scripts/character.mjs). Each outline of the SVG
// becomes one "stroke": an absolute M/C/Z path in hanzi units (y up), fitted into the box the
// kaishu fills, so every form stands where the next will.
//
//   node scripts/ancient-forms.mjs 馬
// fetches the SVGs to public/local/ancient/ (gitignored) and writes public/local/ancient/馬-<key>.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ARGS = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

// The path's commands and numbers. An arc's two flags are single digits and may touch the
// next number ("0120 0" is 0, 1, 20, 0), so they are read one character each.
function tokens(d) {
  const out = [];
  let i = 0;
  let cmd = null;
  let argIndex = 0;
  const skip = () => {
    while (i < d.length && /[\s,]/.test(d[i])) i++;
  };
  while (true) {
    skip();
    if (i >= d.length) break;
    if (/[a-zA-Z]/.test(d[i])) {
      cmd = d[i++];
      argIndex = 0;
      out.push(cmd);
      continue;
    }
    const upper = cmd?.toUpperCase();
    const n = ARGS[upper];
    const slot = n ? argIndex % n : 0;
    if (upper === "A" && (slot === 3 || slot === 4)) {
      out.push(Number(d[i++]));
    } else {
      const m = /^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/.exec(d.slice(i));
      if (!m) throw new Error(`bad path at ${i}: ${d.slice(i, i + 12)}`);
      out.push(Number(m[0]));
      i += m[0].length;
    }
    argIndex++;
  }
  return out;
}

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const line = (p, q) => [p, lerp(p, q, 1 / 3), lerp(p, q, 2 / 3), q];

// An SVG arc (endpoint form) as cubic segments of at most 90 degrees (SVG 1.1, F.6.5).
function arc(p0, rx, ry, phiDeg, large, sweep, p1) {
  if (rx === 0 || ry === 0) return [line(p0, p1)];
  const phi = (phiDeg * Math.PI) / 180;
  const [cos, sin] = [Math.cos(phi), Math.sin(phi)];
  const dx = (p0[0] - p1[0]) / 2;
  const dy = (p0[1] - p1[1]) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lambda > 1) (rx *= Math.sqrt(lambda), (ry *= Math.sqrt(lambda)));
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const coef = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cx1 = (coef * rx * y1) / ry;
  const cy1 = (-coef * ry * x1) / rx;
  const cx = cos * cx1 - sin * cy1 + (p0[0] + p1[0]) / 2;
  const cy = sin * cx1 + cos * cy1 + (p0[1] + p1[1]) / 2;
  const angle = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let dt = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  if (sweep && dt < 0) dt += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9));
  const step = dt / n;
  const k = (4 / 3) * Math.tan(step / 4);
  const at = (t) => [cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos];
  const tangent = (t) => [-rx * Math.sin(t) * cos - ry * Math.cos(t) * sin, -rx * Math.sin(t) * sin + ry * Math.cos(t) * cos];
  const segs = [];
  for (let s = 0; s < n; s++) {
    const a = t1 + s * step;
    const b = a + step;
    const [pa, pb, ta, tb] = [at(a), at(b), tangent(a), tangent(b)];
    segs.push([pa, [pa[0] + k * ta[0], pa[1] + k * ta[1]], [pb[0] - k * tb[0], pb[1] - k * tb[1]], pb]);
  }
  segs[0][0] = p0;
  segs[n - 1][3] = p1;
  return segs;
}

// An SVG path's subpaths, each a list of cubic segments [p0, c1, c2, p1], in the path's units.
export function cubics(d) {
  const t = tokens(d);
  const subs = [];
  let cur = null;
  let pos = [0, 0];
  let start = [0, 0];
  let lastCtrl = null; // the last cubic (or quadratic) control point, for S (or T)
  let lastQuad = null;
  let i = 0;
  let cmd = null;
  const take = (n) => t.slice(i, (i += n));
  while (i < t.length) {
    if (typeof t[i] === "string") cmd = t[i++];
    const upper = cmd.toUpperCase();
    const rel = cmd !== upper;
    const abs = (x, y) => (rel ? [pos[0] + x, pos[1] + y] : [x, y]);
    let ctrl = null;
    let quad = null;
    if (upper === "Z") {
      if (cur && cur.length) subs.push(cur);
      cur = null;
      pos = start;
    } else if (upper === "M") {
      const [x, y] = take(2);
      if (cur && cur.length) subs.push(cur);
      pos = start = abs(x, y);
      cur = [];
      cmd = rel ? "l" : "L"; // further pairs are lines
    } else {
      cur ??= [];
      if (upper === "L" || upper === "H" || upper === "V" || upper === "T" || upper === "Q" || upper === "C" || upper === "S" || upper === "A") {
        if (upper === "L") {
          const q = abs(...take(2));
          cur.push(line(pos, q));
          pos = q;
        } else if (upper === "H") {
          const [x] = take(1);
          const q = [rel ? pos[0] + x : x, pos[1]];
          cur.push(line(pos, q));
          pos = q;
        } else if (upper === "V") {
          const [y] = take(1);
          const q = [pos[0], rel ? pos[1] + y : y];
          cur.push(line(pos, q));
          pos = q;
        } else if (upper === "C") {
          const [a, b, c, e, f, g] = take(6);
          const c1 = abs(a, b);
          const c2 = abs(c, e);
          const q = abs(f, g);
          cur.push([pos, c1, c2, q]);
          ctrl = c2;
          pos = q;
        } else if (upper === "S") {
          const [c, e, f, g] = take(4);
          const c1 = lastCtrl ? [2 * pos[0] - lastCtrl[0], 2 * pos[1] - lastCtrl[1]] : pos;
          const c2 = abs(c, e);
          const q = abs(f, g);
          cur.push([pos, c1, c2, q]);
          ctrl = c2;
          pos = q;
        } else if (upper === "Q" || upper === "T") {
          let qc;
          let q;
          if (upper === "Q") {
            const [a, b, f, g] = take(4);
            qc = abs(a, b);
            q = abs(f, g);
          } else {
            const [f, g] = take(2);
            qc = lastQuad ? [2 * pos[0] - lastQuad[0], 2 * pos[1] - lastQuad[1]] : pos;
            q = abs(f, g);
          }
          cur.push([pos, lerp(pos, qc, 2 / 3), lerp(q, qc, 2 / 3), q]);
          quad = qc;
          pos = q;
        } else {
          const [rx, ry, rot, large, sweep, x, y] = take(7);
          const q = abs(x, y);
          cur.push(...arc(pos, rx, ry, rot, large, sweep, q));
          pos = q;
        }
      } else {
        throw new Error(`path command ${cmd}`);
      }
    }
    lastCtrl = ctrl;
    lastQuad = quad;
  }
  if (cur && cur.length) subs.push(cur);
  return subs;
}

const points = (subs) => subs.flat().flatMap((s) => s);
const bbox = (pts) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};

// Scales SVG subpaths (y down) to fill `box` (hanzi units, y up) keeping their shape, centred.
export function fitTo(subs, box) {
  const b = bbox(subs.flat().flatMap((s) => [s[0], s[3]]));
  const s = Math.min((box.x1 - box.x0) / (b.x1 - b.x0), (box.y1 - box.y0) / (b.y1 - b.y0));
  const ox = (box.x0 + box.x1) / 2 - ((b.x0 + b.x1) / 2) * s;
  const oy = (box.y0 + box.y1) / 2 + ((b.y0 + b.y1) / 2) * s;
  return subs.map((sub) => sub.map((seg) => seg.map(([x, y]) => [ox + x * s, oy - y * s])));
}

const r = (v) => Math.round(v * 10) / 10;

// Subpaths as the absolute path blender/character.py parses: M, C and Z only.
export function toHanziPath(subs) {
  return subs
    .map((sub) => `M ${r(sub[0][0][0])} ${r(sub[0][0][1])} ${sub.map((s) => `C ${s.slice(1).map((p) => `${r(p[0])} ${r(p[1])}`).join(" ")}`).join(" ")} Z`)
    .join(" ");
}

async function main(char) {
  const root = path.resolve(import.meta.dirname, "..");
  const spec = JSON.parse(readFileSync(path.join(root, "series/forms", `${char}.json`), "utf8"));
  const dir = path.join(root, "public/local/ancient");
  mkdirSync(dir, { recursive: true });
  const kaishu = JSON.parse(readFileSync(path.join(root, "public/local/hanzi", `${char}.json`), "utf8"));
  // Make Me a Hanzi's outlines use M, L, Q and Z, in the same units: their box is the target.
  const box = bbox(points(kaishu.strokes.flatMap((d) => cubics(d))));
  for (const form of spec.forms.filter((f) => f.svg)) {
    const svgFile = path.join(dir, `${char}-${form.key}.svg`);
    if (!existsSync(svgFile)) {
      const res = await fetch(form.svg, { headers: { "User-Agent": "sixlines-shorts/1.0 (aug@iterative.day)" } });
      if (!res.ok) throw new Error(`${form.svg}: ${res.status}`);
      writeFileSync(svgFile, await res.text());
    }
    const svg = readFileSync(svgFile, "utf8");
    const ds = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
    const subs = fitTo(ds.flatMap((d) => cubics(d)), box);
    const out = {
      source: form.commons,
      strokes: subs.map((sub) => toHanziPath([sub])),
      medians: subs.map((sub) => sub.map((s) => s[0].map(Math.round))),
    };
    writeFileSync(path.join(dir, `${char}-${form.key}.json`), JSON.stringify(out));
    console.log(`wrote public/local/ancient/${char}-${form.key}.json (${subs.length} outlines)`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const char of process.argv.slice(2)) await main(char);
}
