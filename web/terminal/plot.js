// web/terminal/plot.js
// A port of godot/wangbi-terminal/plot.gd: the hexagram as a wireframe, as the lesson's readout
// plots it (src/scenes/Readout.tsx boxEdges): each line a box 6.2 x 0.5 x 0.45, seen from 16
// units, turned `turn` radians about the vertical and tilted `tilt` about the horizontal.

const LINE_W = 6.2;
const LINE_H = 0.5;
const GAP = 0.3;
const TRIGRAM_GAP = 0.9;
const YIN_GAP = 0.7;
const DEPTH = 0.45;
export const DIST = 16;
export const SCALE_PX = 120;
export const GREEN = "#7dff8a";
export const AMBER = "#ffb347";
const TAP_PAD = 18; // px added around a line's outline, so a thin line is easy to tap

export function lineZ(i) {
  const total = 6 * LINE_H + 4 * GAP + TRIGRAM_GAP;
  return -total / 2 + LINE_H / 2 + i * (LINE_H + GAP) + (i >= 3 ? TRIGRAM_GAP - GAP : 0);
}

function slabs(lines) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const z = lineZ(i);
    if (lines[i] === 1) out.push([i, -LINE_W / 2, LINE_W / 2, z]);
    else {
      const w = (LINE_W - YIN_GAP) / 2;
      out.push([i, -LINE_W / 2, -LINE_W / 2 + w, z], [i, LINE_W / 2 - w, LINE_W / 2, z]);
    }
  }
  return out;
}

export function project([x, y, z], turn, tilt) {
  const rx = x * Math.cos(turn) - y * Math.sin(turn);
  const ry0 = x * Math.sin(turn) + y * Math.cos(turn);
  const ry = ry0 * Math.cos(tilt) - z * Math.sin(tilt);
  const rz = ry0 * Math.sin(tilt) + z * Math.cos(tilt);
  const k = DIST / (DIST + ry);
  return [rx * k * SCALE_PX, -rz * k * SCALE_PX];
}

// Monotone chain; returns the hull counter-clockwise in screen terms.
function hull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const out = [];
    for (const q of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  return half(p).concat(half(p.slice().reverse()));
}

function inside(poly, [x, y]) {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[(i + 1) % poly.length];
    const c = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (c !== 0) {
      if (sign && Math.sign(c) !== sign) return false;
      sign = Math.sign(c);
    }
  }
  return true;
}

function distToSegment([x, y], [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}

export class Plot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.lines = [1, 1, 1, 1, 1, 1];
    this.amber = [];
    this.turn = 0;
    this.tilt = 0; // a small tilt from a vertical drag; 0 outside a drag
    this.outlines = new Map(); // line number -> hulls, in plot-local px, as last drawn
  }

  draw(ctx) {
    this.outlines.clear();
    ctx.lineWidth = 2;
    ctx.lineCap = "butt";
    for (const [i, x0, x1, z] of slabs(this.lines)) {
      const n = i + 1;
      const c = [];
      for (const x of [x0, x1])
        for (const y of [-DEPTH / 2, DEPTH / 2])
          for (const zz of [z - LINE_H / 2, z + LINE_H / 2]) c.push(project([x, y, zz], this.turn, this.tilt));
      // Corner index is x*4 + y*2 + z; the 12 edges join corners that differ in one bit.
      ctx.strokeStyle = this.amber.includes(n) ? AMBER : GREEN;
      ctx.beginPath();
      for (let a = 0; a < 8; a++)
        for (const b of [1, 2, 4])
          if (!(a & b)) {
            ctx.moveTo(this.x + c[a][0], this.y + c[a][1]);
            ctx.lineTo(this.x + c[a | b][0], this.y + c[a | b][1]);
          }
      ctx.stroke();
      this.outlines.set(n, [...(this.outlines.get(n) ?? []), hull(c)]);
    }
  }

  // The line under a point (in design px), within TAP_PAD of its outline; 0 for none.
  lineAt(px, py) {
    const p = [px - this.x, py - this.y];
    for (const [n, hulls] of this.outlines)
      for (const h of hulls) {
        if (inside(h, p)) return n;
        for (let i = 0; i < h.length; i++) if (distToSegment(p, h[i], h[(i + 1) % h.length]) <= TAP_PAD) return n;
      }
    return 0;
  }
}
