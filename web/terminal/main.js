// web/terminal/main.js
// The Wang Bi terminal as a plain web page: godot/wangbi-terminal/main.gd redrawn on a 2D canvas
// at the same 1080x1920 design size, letterboxed to fit the window (Godot's "keep").
import { Plot, lineZ, project } from "./plot.js";
import * as Reading from "./reading.js";
import { DRAG_TAP_THRESHOLD, SETTLE_TIME, TURN_KEYS, dragAngles, turnByKeys } from "./turning.js";

const GREEN = "rgb(125,255,138)"; // #7dff8a
const DIM = "rgba(125,255,138,0.45)"; // Color(0.49, 1.0, 0.54, 0.45)
const CYAN = "rgb(94,231,255)"; // #5ee7ff
const OUTLINE = (c) => c.replace(/rgba?\(([^,]+,[^,]+,[^,)]+).*/, "rgba($1,0.35)"); // Color(colour, 0.35)
const PROMPT = "TAP A LINE TO CHANGE IT";
// The keyboard legend differs from the Godot build's: this page also turns the plot with WASD
// or the arrows, so sound is on M instead of S.
const LEGEND_KEYBOARD = "1-6  FLIP A LINE      M  SOUND ON/OFF\nG, NUMBER, ENTER  GO TO     WASD OR DRAG  TURN IT";
const LEGEND_TOUCH = "TAP THE NAME  GO TO A HEXAGRAM\nDRAG  TURN IT";
const LOG_TOP = 960;
const ROW_GAP = 45;
const W = 1080;
const H = 1920;

const PAD_COLS = 3;
const PAD_ROWS = 4;
const PAD_CELL_W = 280;
const PAD_CELL_H = 140;
const PAD_CELL_GAP = 20;
const PAD_MARGIN = 30;
const PAD_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", "GO"];
const PAD_AREA_TOP = 960;
const PAD_AREA_BOTTOM = 1640;

// Linear volumes, as main.gd's MIX.
const MIX = { tick: 0.8, sweep: 0.7, warble: 0.5, winddown: 0.6, relay: 1.0, bed: 0.5 };

// ---- Text, laid out the way Godot's Label lays it out with PixelOperator and its Noto
// fallback (measured against the Godot build with godot/wangbi-terminal/tests/metrics.gd and
// screenshots): every line is as tall as Noto's ascent plus descent, each rounded up, with 3 px
// between lines. A line drawn wholly in PixelOperator sits centred in that height on its own
// ascent and descent; a line with Chinese (or anything else past Latin-1) sits on Noto's ascent.
// Glyphs advance by their exact widths and land on whole pixels. The outline reaches about
// 1.5 px past each glyph.
const LINE_SPACING = 3;
const OUTLINE_WIDTH = 3;
const ascent = (size) => Math.ceil(1.16 * size);
const lineHeight = (size) => ascent(size) + Math.ceil(0.288 * size);
const pixelAscent = (size) => Math.ceil(0.8125 * size);
const pixelHeight = (size) => pixelAscent(size) + Math.ceil(0.1875 * size);
const baselineOf = (row, size) =>
  row.some(([c]) => c.codePointAt(0) > 0xff) ? ascent(size) : Math.floor((lineHeight(size) - pixelHeight(size)) / 2) + pixelAscent(size);
const fontOf = (size) => `${size}px PixelOperator, NotoTC`;

const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
const advances = new Map();
function advance(size, ch) {
  const k = size + ch;
  if (!advances.has(k)) {
    ctx.font = fontOf(size);
    advances.set(k, ctx.measureText(ch).width);
  }
  return advances.get(k);
}

class Label {
  constructor(x, y, size, colour, { width = 960, align = "left", height = 0 } = {}) {
    Object.assign(this, { x, y, size, colour, width, align, height, text: "", visible: -1 });
  }
  // Rows of [character, index in text, x], wrapped at spaces (a word longer than the width
  // breaks where it must), as AUTOWRAP_WORD_SMART does.
  rows() {
    if (this._for === this.text) return this._rows;
    const rows = [];
    let i = 0;
    for (const para of this.text.split("\n")) {
      let row = [];
      let x = 0;
      for (const word of para.match(/[^ ]+ *| +/g) ?? []) {
        const chars = [...word];
        const wordInk = chars.reduce((w, c) => w + (c === " " ? 0 : advance(this.size, c)), 0);
        if (row.length && x + wordInk > this.width && this.align === "left") {
          rows.push(row);
          row = [];
          x = 0;
        }
        for (const c of chars) {
          const a = advance(this.size, c);
          if (c !== " " && x + a > this.width && row.length) {
            rows.push(row);
            row = [];
            x = 0;
          }
          row.push([c, i, x]);
          x += a;
          i += c.length;
        }
      }
      rows.push(row);
      i += 1; // the newline
    }
    for (const r of rows) r.width = r.filter(([c]) => c !== " ").reduce((m, [c, , x]) => Math.max(m, x + advance(this.size, c)), 0);
    this._for = this.text;
    this._rows = rows;
    return rows;
  }
  get minHeight() {
    const n = this.rows().length;
    return n * lineHeight(this.size) + (n - 1) * LINE_SPACING;
  }
  rect() {
    return { x: this.x, y: this.y, w: this.width, h: this.height || this.minHeight };
  }
  draw() {
    const rows = this.rows();
    const top = this.height ? this.y + Math.floor((this.height - this.minHeight) / 2) : this.y;
    ctx.font = fontOf(this.size);
    const glyphs = [];
    rows.forEach((row, r) => {
      const base = top + r * (lineHeight(this.size) + LINE_SPACING) + baselineOf(row, this.size);
      const dx = this.align === "right" ? this.width - row.width : this.align === "center" ? Math.round((this.width - row.width) / 2) : 0;
      for (const [c, i, x] of row) if (c !== " " && (this.visible < 0 || i < this.visible)) glyphs.push([c, Math.round(this.x + dx + x), base]);
    });
    ctx.lineJoin = "round";
    ctx.lineWidth = OUTLINE_WIDTH;
    ctx.strokeStyle = OUTLINE(this.colour);
    for (const [c, x, y] of glyphs) ctx.strokeText(c, x, y);
    ctx.fillStyle = this.colour;
    for (const [c, x, y] of glyphs) ctx.fillText(c, x, y);
  }
}

// ---- State, as main.gd.
let data = null;
let lines = [0, 1, 0, 0, 0, 0];
const plot = new Plot(540, 560);
const title = new Label(60, 70, 44, GREEN);
const logLabel = new Label(60, LOG_TOP, 34, GREEN);
const trigrams = new Label(60, 1250, 34, DIM);
const wangbi = new Label(60, 1380, 34, GREEN);
const legend = new Label(60, 1665, 28, DIM);
const prompt = new Label(60, 1770, 38, CYAN);
const soundToggle = new Label(760, 1770, 30, DIM, { width: 260, align: "right" });
const typedLabels = [logLabel, trigrams, wangbi];

const gridW = PAD_COLS * PAD_CELL_W + (PAD_COLS - 1) * PAD_CELL_GAP;
const gridH = PAD_ROWS * PAD_CELL_H + (PAD_ROWS - 1) * PAD_CELL_GAP;
const panel = { x: 50, w: 980, h: gridH + 2 * PAD_MARGIN };
panel.y = PAD_AREA_TOP + (PAD_AREA_BOTTOM - PAD_AREA_TOP - panel.h) / 2;
const padCells = PAD_LABELS.map((t, idx) => {
  const x = panel.x + (panel.w - gridW) / 2 + (idx % PAD_COLS) * (PAD_CELL_W + PAD_CELL_GAP);
  const y = panel.y + PAD_MARGIN + Math.floor(idx / PAD_COLS) * (PAD_CELL_H + PAD_CELL_GAP);
  const label = new Label(x, y, 40, GREEN, { width: PAD_CELL_W, align: "center", height: PAD_CELL_H });
  label.text = t;
  return { x, y, w: PAD_CELL_W, h: PAD_CELL_H, label };
});

let typed = 0;
const typingSpeed = 25; // characters a second, as the lesson types
let tween = null;
let entering = "";
let entry = false;
let padOpen = false;
let soundOn = true;
let drag = null; // { start: [x, y], turn, tilt, moved }
const held = new Set(); // turn keys down (KeyboardEvent.code)
let keyBase = null; // the turn when the turn keys were first held; null while none are

const grow = (r, by) => ({ x: r.x - by, y: r.y - by, w: r.w + 2 * by, h: r.h + 2 * by });
const has = (r, [x, y]) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;

function showLines(l) {
  lines = l;
  const e = data[Reading.key(l)];
  title.text = Reading.title(e);
  const rows = [];
  for (let n = 6; n >= 1; n--) rows.push(Reading.logRow(l, n));
  logLabel.text = rows.join("\n");
  trigrams.text = Reading.trigramRows(e).join("\n");
  wangbi.text = "WANG BI\n" + Reading.wangbiRows(e).join("\n");
  plot.lines = l;
  plot.amber = Reading.masterLines(e);
  prompt.text = PROMPT;
  // Stack each block below the real (wrapped) height of the one above it.
  trigrams.y = logLabel.y + logLabel.minHeight + ROW_GAP;
  wangbi.y = trigrams.y + trigrams.minHeight + ROW_GAP;
}

// ---- Tweens: one at a time, as main.gd's `tween`.
const sineInOut = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
const sineOut = (t) => Math.sin((t * Math.PI) / 2);
function startTween(to, seconds, ease) {
  const from = {};
  for (const k in to) from[k] = plot[k];
  tween = { from, to, seconds, ease, t: 0 };
}
function stepTween(delta) {
  if (!tween) return;
  tween.t = Math.min(tween.t + delta, tween.seconds);
  const f = tween.ease(tween.t / tween.seconds);
  for (const k in tween.to) plot[k] = tween.from[k] + (tween.to[k] - tween.from[k]) * f;
  if (tween.t >= tween.seconds) tween = null;
}

function setLines(l) {
  const before = Reading.masterLines(data[Reading.key(lines)]);
  exitEntry();
  showLines(l);
  typed = 0;
  for (const x of typedLabels) x.visible = 0;
  startTween({ turn: Reading.turnTarget(plot.turn) }, 6.0, sineInOut);
  play("relay");
  if (Reading.masterLines(data[Reading.key(l)]).some((n) => !before.includes(n))) play("warble");
}

function stepTyping(delta) {
  const total = typedLabels.reduce((s, x) => s + x.text.length, 0);
  if (typed >= total) return;
  const before = Math.floor(typed);
  typed = Math.min(typed + delta * typingSpeed, total);
  let left = Math.floor(typed);
  for (const x of typedLabels) {
    x.visible = Math.min(left, x.text.length);
    left -= x.visible;
  }
  if (Math.floor(typed) > before) play("tick");
  if (typed >= total) play("winddown");
}

// ---- Entry and the number pad.
function exitEntry() {
  entry = false;
  padOpen = false;
  prompt.text = PROMPT;
}
function openPad() {
  entry = true;
  entering = "";
  padOpen = true;
  prompt.text = "GO TO: _";
}
function go() {
  const l = entering !== "" ? Reading.linesOf(data, parseInt(entering, 10)) : [];
  exitEntry();
  if (l.length) setLines(l);
}
function handlePadTap(p) {
  const cell = padCells.find((c) => has(c, p));
  if (!cell) return exitEntry();
  play("relay");
  const t = cell.label.text;
  if (t === "DEL") entering = entering.slice(0, -1);
  else if (t === "GO") return go();
  else if (entering.length < 2) entering += t;
  prompt.text = `GO TO: ${entering}_`;
}

// ---- Sound: Web Audio, started on the first tap or key (browsers need a gesture). The
// bytes are fetched once the page is drawn; they are decoded when the context exists.
const NAMES = Object.keys(MIX);
const EXT = new Audio().canPlayType('audio/ogg; codecs="vorbis"') ? "ogg" : "m4a";
let bytes = null;
let ac = null;
let master = null;
const buffers = {};
const gains = {};
const voices = {}; // name -> playing sources, newest last
let ready = false;

function fetchSounds() {
  bytes = Object.fromEntries(NAMES.map((n) => [n, fetch(`sfx/${n}.${EXT}`).then((r) => r.arrayBuffer())]));
}
function unlock() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = soundOn ? 1 : 0;
    master.connect(ac.destination);
    decode();
  }
  if (ac.state !== "running") ac.resume();
}
async function decode() {
  if (!bytes) fetchSounds();
  await Promise.all(
    NAMES.map(async (n) => {
      buffers[n] = await ac.decodeAudioData(await bytes[n]);
      gains[n] = ac.createGain();
      gains[n].gain.value = MIX[n];
      gains[n].connect(master);
      voices[n] = [];
    })
  );
  ready = true;
  const bed = ac.createBufferSource();
  bed.buffer = buffers.bed;
  bed.loop = true; // keeps looping under the mute, as in Godot
  bed.connect(gains.bed);
  bed.start();
  play("sweep"); // the first moment sound can play stands in for the start
}
function play(name) {
  if (!ready) return;
  const v = voices[name];
  // One voice per sound (a replay restarts it), two for the tick, as Godot's max_polyphony.
  while (v.length >= (name === "tick" ? 2 : 1)) v.shift().stop();
  const s = ac.createBufferSource();
  s.buffer = buffers[name];
  s.connect(gains[name]);
  s.onended = () => v.includes(s) && v.splice(v.indexOf(s), 1);
  s.start();
  v.push(s);
}
function setSound(on) {
  soundOn = on;
  if (master) master.gain.value = on ? 1 : 0;
  soundToggle.text = on ? "SOUND ON" : "SOUND OFF";
}

// ---- Input: pointer events for mouse and touch alike, in design pixels.
let view = { scale: 1, x: 0, y: 0 };
const toDesign = (e) => {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left - view.x) / view.scale, (e.clientY - r.top - view.y) / view.scale];
};

function press(p) {
  if (padOpen) return handlePadTap(p);
  if (has(grow(soundToggle.rect(), 20), p)) return setSound(!soundOn);
  if (has(grow(title.rect(), 20), p)) return openPad();
  // Anything else may become a drag or a tap; which it is is only known on release.
  drag = { start: p, turn: plot.turn, tilt: plot.tilt, moved: false };
}
function move(p) {
  if (!drag) return;
  const dx = p[0] - drag.start[0];
  const dy = p[1] - drag.start[1];
  if (!drag.moved && Math.hypot(dx, dy) >= DRAG_TAP_THRESHOLD) {
    drag.moved = true;
    tween = null;
  }
  if (drag.moved) Object.assign(plot, dragAngles(dx, dy, drag.turn, drag.tilt));
}

// Held turn keys turn the plot smoothly; when the last is released it eases back square, as
// after a drag. They do nothing during G entry or the pad (the plot settles then too).
function stepKeys(delta) {
  if (held.size && !entry && !drag) {
    if (keyBase === null) keyBase = plot.turn;
    tween = null;
    Object.assign(plot, turnByKeys(held, delta, { turn: plot.turn, tilt: plot.tilt, base: keyBase }));
  } else if (keyBase !== null) {
    keyBase = null;
    startTween({ turn: Reading.nearestSquare(plot.turn), tilt: 0 }, SETTLE_TIME, sineOut);
  }
}
function release(p, cancelled = false) {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (d.moved) {
    // Turn back square, slowly, with no overshoot.
    startTween({ turn: Reading.nearestSquare(plot.turn), tilt: 0 }, SETTLE_TIME, sineOut);
  } else if (!cancelled) {
    const n = plot.lineAt(...p);
    if (n) setLines(Reading.flip(lines, n));
  }
}

canvas.addEventListener("pointerdown", (e) => {
  unlock();
  if (!data || !e.isPrimary || e.button !== 0) return;
  canvas.setPointerCapture(e.pointerId);
  press(toDesign(e));
});
canvas.addEventListener("pointermove", (e) => e.isPrimary && move(toDesign(e)));
canvas.addEventListener("pointerup", (e) => {
  unlock(); // on touch, the release is what counts as the gesture for audio
  if (e.isPrimary && e.button === 0) release(toDesign(e));
});
canvas.addEventListener("pointercancel", (e) => e.isPrimary && release(toDesign(e), true));

window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  unlock();
  if (!data) return;
  if (!entry && TURN_KEYS[e.code]) {
    held.add(e.code);
    return e.preventDefault();
  }
  if (e.repeat) return;
  const digit = /^(Digit|Numpad)([0-9])$/.exec(e.code)?.[2];
  const k = e.key.toLowerCase();
  if (entry) {
    if (digit !== undefined && entering.length < 2) entering += digit;
    else if (e.key === "Enter") go();
    else if (e.key === "Escape") exitEntry();
    prompt.text = entry ? `GO TO: ${entering}_` : PROMPT;
  } else if (k === "g") {
    entry = true;
    entering = "";
    prompt.text = "GO TO: _";
  } else if (k === "m") setSound(!soundOn);
  else if (/^Digit[1-6]$/.test(e.code)) setLines(Reading.flip(lines, Number(digit)));
  else return;
  e.preventDefault();
});

window.addEventListener("keyup", (e) => held.delete(e.code));
window.addEventListener("blur", () => held.clear());

// ---- Drawing.
let scan = null; // the scanlines, at device resolution, as scanlines.gdshader draws them
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const { width: cw, height: ch } = canvas.getBoundingClientRect();
  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  const scale = Math.min(cw / W, ch / H);
  view = { scale, x: (cw - W * scale) / 2, y: (ch - H * scale) / 2, dpr };
  // 640 dark bands down the screen, each half a band tall, 18% black.
  scan = document.createElement("canvas");
  scan.width = 1;
  scan.height = canvas.height;
  const s = scan.getContext("2d");
  s.fillStyle = "rgba(0,0,0,0.18)";
  for (let j = 0; j < canvas.height; j++) if (((((j + 0.5) / canvas.height) * 640) % 1) >= 0.5) s.fillRect(0, j, 1, 1);
}

function frameRect(x, y, w, h) {
  // ReferenceRect: a 4 px border drawn on the rect's edge.
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);
}

function draw() {
  const { scale, x, y, dpr } = view;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, x * dpr, y * dpr);
  frameRect(40, 40, 1000, 1840);
  title.draw();
  plot.draw(ctx);
  for (const l of [logLabel, trigrams, wangbi, legend, prompt, soundToggle]) l.draw();
  if (padOpen) {
    ctx.fillStyle = "#000";
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    for (const c of padCells) {
      frameRect(c.x, c.y, c.w, c.h);
      c.label.draw();
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(scan, Math.round(x * dpr), 0, Math.round(W * scale * dpr), canvas.height);
}

let last = 0;
function tick(t) {
  const delta = last ? Math.min((t - last) / 1000, 0.1) : 0;
  last = t;
  stepTween(delta);
  stepKeys(delta);
  stepTyping(delta);
  draw();
  requestAnimationFrame(tick);
}

async function start() {
  const faces = [new FontFace("PixelOperator", "url(fonts/PixelOperator-Bold.woff2)"), new FontFace("NotoTC", "url(fonts/NotoSansTC-subset.woff2)")];
  const [json] = await Promise.all([fetch("data/hexagrams.json").then((r) => r.json()), ...faces.map((f) => f.load().then(() => document.fonts.add(f)))]);
  data = json;
  legend.text = matchMedia("(pointer: coarse)").matches ? LEGEND_TOUCH : LEGEND_KEYBOARD;
  showLines(lines);
  setSound(soundOn);
  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(tick);
  fetchSounds();
}
start();

// For checks from a browser console or a test driver.
window.terminal = {
  get lines() { return lines.slice(); },
  get entering() { return entering; },
  get padOpen() { return padOpen; },
  get soundOn() { return soundOn; },
  get turn() { return plot.turn; },
  get typed() { return typed; },
  get ready() { return ready; },
  point(n) { // a point on line n, a quarter in from its left end, in client px
    const [px, py] = plotPoint(n);
    const r = canvas.getBoundingClientRect();
    return [r.left + view.x + px * view.scale, r.top + view.y + py * view.scale];
  },
  padPoint(t) {
    const c = padCells.find((c) => c.label.text === t);
    const r = canvas.getBoundingClientRect();
    return [r.left + view.x + (c.x + c.w / 2) * view.scale, r.top + view.y + (c.y + c.h / 2) * view.scale];
  },
  design(x, y) {
    const r = canvas.getBoundingClientRect();
    return [r.left + view.x + x * view.scale, r.top + view.y + y * view.scale];
  },
};
function plotPoint(n) {
  const [x, y] = project([-1.55, 0, lineZ(n - 1)], plot.turn, plot.tilt);
  return [plot.x + x, plot.y + y];
}
