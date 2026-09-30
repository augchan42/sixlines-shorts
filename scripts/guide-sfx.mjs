// The Guide device's sound inventory, synthesised (the user, 2026-09-30: "we can use synthesized
// sounds, that's fine, just make sure you have a full inventory to select from"; "you can get
// creative with it"). Every sound is drawn from a formula below with a seeded random source, so the
// files are the same on every run.
//   node scripts/guide-sfx.mjs
// Writes public/local/sfx/guide/<name>.wav (44.1 kHz mono), records each sound's role, description,
// length and hash in series/specials/guide-sfx.json, and writes out/sfx/guide/audition.m4a: each
// sound once, after its number spoken by macOS `say`, so the user can pick by ear.
// Tones sit above 250 Hz so a phone speaker plays them.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const SR = 44100;
const TAU = 2 * Math.PI;

// mulberry32: a small seeded random source.
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buf = (sec) => new Float32Array(Math.round(sec * SR));
const note = (n) => 440 * 2 ** ((n - 69) / 12); // MIDI number to Hz
// Attack-decay envelope: linear rise over a seconds, then exponential fall with time constant d.
const ad = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
const tri = (ph) => 1 - 4 * Math.abs(((ph / TAU) % 1) - 0.5);

// Add a tone into out at time at. f is a frequency or a function of time (a glide).
const tone = (out, at, { f, dur, a = 0.004, d = 0.08, wave = "sine", vol = 1, fm, vib }) => {
  let ph = 0;
  const n0 = Math.round(at * SR);
  for (let i = 0; i < dur * SR && n0 + i < out.length; i++) {
    const t = i / SR;
    let hz = typeof f === "function" ? f(t) : f;
    if (vib) hz *= 1 + vib.depth * Math.sin(TAU * vib.rate * t);
    ph += (TAU * hz) / SR;
    let s;
    if (fm) s = Math.sin(ph + fm.index * Math.exp(-t / fm.decay) * Math.sin(ph * fm.ratio));
    else if (wave === "tri") s = tri(ph);
    else if (wave === "soft-square") s = Math.tanh(3 * Math.sin(ph)) / Math.tanh(3);
    else s = Math.sin(ph);
    const fade = Math.min(1, (dur - t) / 0.005); // no click at the cut
    out[n0 + i] += vol * s * ad(t, a, d) * fade;
  }
};

// Band-passed noise (a two-pole resonator), centre fixed or gliding.
const noise = (out, at, { dur, centre, q = 4, a = 0.002, d = 0.05, vol = 1, seed = 1 }) => {
  const r = rng(seed);
  let y1 = 0, y2 = 0;
  const n0 = Math.round(at * SR);
  for (let i = 0; i < dur * SR && n0 + i < out.length; i++) {
    const t = i / SR;
    const fc = typeof centre === "function" ? centre(t) : centre;
    const w = (TAU * fc) / SR;
    const rad = Math.exp(-w / (2 * q));
    const y = (r() * 2 - 1) * (1 - rad) + 2 * rad * Math.cos(w) * y1 - rad * rad * y2;
    y2 = y1;
    y1 = y;
    const fade = Math.min(1, (dur - t) / 0.004);
    out[n0 + i] += vol * 6 * y * ad(t, a, d) * fade;
  }
};

// Karplus-Strong plucked string: warm and wooden.
const pluck = (out, at, { f, dur = 0.5, vol = 1, seed = 2, damp = 0.996 }) => {
  const r = rng(seed);
  const len = Math.round(SR / f);
  const ring = Float32Array.from({ length: len }, () => r() * 2 - 1);
  // Smooth the starting noise five times: a softer, less bright pluck.
  for (let pass = 0; pass < 5; pass++) for (let j = 0; j < len; j++) ring[j] = 0.5 * (ring[j] + ring[(j + 1) % len]);
  const n0 = Math.round(at * SR);
  for (let i = 0; i < dur * SR && n0 + i < out.length; i++) {
    const j = i % len;
    const s = ring[j];
    ring[j] = damp * 0.5 * (s + ring[(j + 1) % len]);
    out[n0 + i] += vol * s * Math.min(1, (dur - i / SR) / 0.01);
  }
};

const bell = (out, at, n, vol = 1, d = 0.35) => tone(out, at, { f: note(n), dur: d * 4, d, vol, fm: { ratio: 2, index: 1.1, decay: d / 3 } });

// Pentatonic notes (C major pentatonic, C5 to C7) for random chatter.
const PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96];

const SOUNDS = {
  // Switching on
  "boot-arp": ["boot", "rising triangle arpeggio C5 E5 G5 C6, a cheerful ready", 1.2, (o) => [72, 76, 79, 84].forEach((n, i) => tone(o, i * 0.09, { f: note(n), dur: 0.8, d: 0.25, wave: "tri", vol: 0.5 }))],
  "boot-bells": ["boot", "soft FM bells, the same arpeggio as a chord that blooms", 1.6, (o) => [72, 76, 79, 84].forEach((n, i) => bell(o, i * 0.06, n, 0.35, 0.4))],
  "boot-sweep": ["boot", "a sine that rises 300 to 900 Hz with a slight shimmer, then settles", 1.2, (o) => tone(o, 0, { f: (t) => 300 + 600 * Math.min(1, t / 0.6) ** 0.6, dur: 1.2, a: 0.05, d: 0.5, vol: 0.5, vib: { rate: 7, depth: 0.01 } })],
  "boot-thunk-hum": ["boot", "a relay thunk, then a hum that swells in at 330 Hz with its harmonics", 1.5, (o) => { noise(o, 0, { dur: 0.06, centre: 900, q: 3, d: 0.015, vol: 0.8 }); [1, 2, 3].forEach((h) => tone(o, 0.05, { f: 330 * h, dur: 1.4, a: 0.35, d: 0.6, vol: 0.3 / h })); }],
  "boot-flutter": ["boot", "a flurry of random notes that settles on a chord: the machine thinking, then ready", 1.6, (o) => { const r = rng(7); for (let i = 0; i < 14; i++) tone(o, i * 0.045, { f: note(PENTA[Math.floor(r() * PENTA.length)]), dur: 0.06, d: 0.02, vol: 0.3 }); [72, 79, 84].forEach((n) => tone(o, 0.68, { f: note(n), dur: 0.9, d: 0.3, wave: "tri", vol: 0.3 })); }],
  "boot-pluck": ["boot", "three plucked notes, wooden and warm", 1.2, (o) => [67, 72, 76].forEach((n, i) => pluck(o, i * 0.11, { f: note(n), dur: 0.9, vol: 0.6, seed: i + 3 }))],

  // Something appears
  "blip-hi": ["blip", "short sine at 1320 Hz", 0.15, (o) => tone(o, 0, { f: 1320, dur: 0.15, d: 0.035, vol: 0.5 })],
  "blip-mid": ["blip", "short sine at 880 Hz", 0.15, (o) => tone(o, 0, { f: 880, dur: 0.15, d: 0.04, vol: 0.55 })],
  "blip-lo": ["blip", "short sine at 587 Hz", 0.18, (o) => tone(o, 0, { f: 587, dur: 0.18, d: 0.05, vol: 0.6 })],
  "blip-tri": ["blip", "short triangle at 740 Hz, a little reedier", 0.15, (o) => tone(o, 0, { f: 740, dur: 0.15, d: 0.04, wave: "tri", vol: 0.45 })],
  "blip-droplet": ["blip", "a droplet: pitch falls 1400 to 600 Hz in 60 ms", 0.12, (o) => tone(o, 0, { f: (t) => 600 + 800 * Math.exp(-t / 0.02), dur: 0.12, d: 0.04, vol: 0.55 })],
  "blip-up": ["blip", "two notes up, 660 then 990 Hz: yes", 0.25, (o) => { tone(o, 0, { f: 660, dur: 0.1, d: 0.04, vol: 0.5 }); tone(o, 0.08, { f: 990, dur: 0.15, d: 0.05, vol: 0.5 }); }],
  "blip-down": ["blip", "two notes down, 990 then 660 Hz: done", 0.25, (o) => { tone(o, 0, { f: 990, dur: 0.1, d: 0.04, vol: 0.5 }); tone(o, 0.08, { f: 660, dur: 0.15, d: 0.05, vol: 0.5 }); }],
  "blip-bell": ["blip", "a small FM bell at E5", 0.5, (o) => bell(o, 0, 76, 0.5, 0.12)],
  "blip-pluck": ["blip", "a plucked C5, wooden", 0.4, (o) => pluck(o, 0, { f: note(72), dur: 0.4, vol: 0.7, damp: 0.99 })],
  "blip-wood": ["blip", "a woodblock knock, resonant noise at 1 kHz", 0.12, (o) => noise(o, 0, { dur: 0.12, centre: 1000, q: 18, d: 0.025, vol: 1.2 })],
  "blip-pop": ["blip", "a soft pop: a sine that jumps up 400 to 900 Hz in 30 ms", 0.1, (o) => tone(o, 0, { f: (t) => 400 + 500 * Math.min(1, t / 0.03), dur: 0.1, d: 0.03, vol: 0.6 })],

  // Keys and printing
  "tick-soft": ["tick", "a soft click, noise at 1.6 kHz for 8 ms", 0.05, (o) => noise(o, 0, { dur: 0.05, centre: 1600, q: 2, d: 0.004, vol: 0.9 })],
  "tick-key": ["tick", "a keyboard key: press and release", 0.12, (o) => { noise(o, 0, { dur: 0.04, centre: 1800, q: 2.5, d: 0.006, vol: 0.9, seed: 3 }); noise(o, 0.07, { dur: 0.04, centre: 2600, q: 2.5, d: 0.004, vol: 0.5, seed: 4 }); }],
  "type-soft": ["tick", "two seconds of unhurried typing", 2, (o) => { const r = rng(11); let t = 0; while (t < 1.9) { noise(o, t, { dur: 0.04, centre: 1300 + r() * 1000, q: 2.5, d: 0.005, vol: 0.5 + r() * 0.4, seed: Math.floor(r() * 1e6) }); t += 0.07 + r() * 0.12; } }],
  "type-teleprinter": ["tick", "a teleprinter line at ten characters a second, then its bell", 1.8, (o) => { for (let i = 0; i < 12; i++) noise(o, i * 0.1, { dur: 0.05, centre: 1200, q: 3, d: 0.01, vol: 0.7, seed: 20 + i }); bell(o, 1.25, 93, 0.35, 0.15); }],

  // Working
  "chatter-bleeps": ["chatter", "three seconds of quiet random pentatonic bleeps, ten a second", 3, (o) => { const r = rng(5); for (let t = 0; t < 2.9; t += 0.1) if (r() > 0.2) tone(o, t, { f: note(PENTA[Math.floor(r() * PENTA.length)]), dur: 0.07, d: 0.02, vol: 0.25 }); }],
  "chatter-droplets": ["chatter", "three seconds of scattered droplets", 3, (o) => { const r = rng(9); for (let t = 0; t < 2.9; t += 0.05 + r() * 0.2) { const top = 900 + r() * 900; tone(o, t, { f: (x) => top * 0.5 + top * 0.5 * Math.exp(-x / 0.02), dur: 0.1, d: 0.03, vol: 0.25 }); } }],
  "chatter-relays": ["chatter", "three seconds of relay clicks in bursts", 3, (o) => { const r = rng(13); let t = 0; while (t < 2.9) { const n = 2 + Math.floor(r() * 5); for (let k = 0; k < n; k++) noise(o, t + k * 0.035, { dur: 0.03, centre: 700 + r() * 600, q: 6, d: 0.006, vol: 0.6, seed: Math.floor(r() * 1e6) }); t += n * 0.035 + 0.15 + r() * 0.3; } }],
  "compute-sequence": ["chatter", "a small sequencer, eight notes a second, a 1970s computer at work", 3, (o) => { const seq = [72, 79, 76, 84, 74, 79, 81, 76]; for (let i = 0; i < 24; i++) tone(o, i * 0.125, { f: note(seq[i % 8] + (i >= 16 ? 2 : 0)), dur: 0.11, d: 0.04, wave: "tri", vol: 0.28 }); }],
  "hum-bed": ["chatter", "a soft hum at 330 and 495 Hz with a slow drift, to go under a scene", 4, (o) => { tone(o, 0, { f: 330, dur: 4, a: 0.5, d: 20, vol: 0.12, vib: { rate: 0.3, depth: 0.002 } }); tone(o, 0, { f: 495, dur: 4, a: 0.5, d: 20, vol: 0.06, vib: { rate: 0.23, depth: 0.002 } }); }],

  // Accents
  "chime-page": ["chime", "three rising notes: a new page", 1, (o) => [79, 84, 88].forEach((n, i) => tone(o, i * 0.07, { f: note(n), dur: 0.6, d: 0.15, wave: "tri", vol: 0.35 }))],
  "chime-ding": ["chime", "one FM ding at C6: an entry found", 1.2, (o) => bell(o, 0, 84, 0.5, 0.3)],
  "chime-question": ["chime", "a glide up, like a raised eyebrow", 0.5, (o) => tone(o, 0, { f: (t) => 500 * 2 ** (t / 0.35), dur: 0.45, a: 0.02, d: 0.2, vol: 0.45 })],
  "chime-hmm": ["chime", "two notes, down then up: well, well", 0.7, (o) => { tone(o, 0, { f: note(76), dur: 0.3, d: 0.1, wave: "tri", vol: 0.4 }); tone(o, 0.22, { f: note(81), dur: 0.4, d: 0.12, wave: "tri", vol: 0.4 }); }],
  "error-buzz": ["chime", "two soft buzzes at 330 Hz: not recommended", 0.5, (o) => [0, 0.2].forEach((t) => tone(o, t, { f: 330, dur: 0.14, a: 0.005, d: 0.08, wave: "soft-square", vol: 0.3 }))],
  "error-boing": ["chime", "a cartoon boing, falling 700 to 280 Hz with a wobble", 0.6, (o) => tone(o, 0, { f: (t) => 280 + 420 * Math.exp(-t / 0.12), dur: 0.6, d: 0.2, vol: 0.5, vib: { rate: 11, depth: 0.04 } })],

  // Screen changes
  "whoosh-up": ["whoosh", "noise that sweeps up, 500 Hz to 4 kHz", 0.45, (o) => noise(o, 0, { dur: 0.45, centre: (t) => 500 * 8 ** (t / 0.45), q: 3, a: 0.2, d: 0.08, vol: 0.5, seed: 31 })],
  "whoosh-down": ["whoosh", "noise that sweeps down, 4 kHz to 500 Hz", 0.45, (o) => noise(o, 0, { dur: 0.45, centre: (t) => 4000 / 8 ** (t / 0.45), q: 3, a: 0.2, d: 0.08, vol: 0.5, seed: 32 })],
  "zip": ["whoosh", "a fast sine zip, 400 Hz to 2 kHz in 70 ms", 0.12, (o) => tone(o, 0, { f: (t) => 400 * 5 ** Math.min(1, t / 0.07), dur: 0.12, d: 0.05, vol: 0.4 })],
  "slide": ["whoosh", "a slow glide 600 to 900 Hz, for something sliding in", 0.35, (o) => tone(o, 0, { f: (t) => 600 + 300 * Math.min(1, t / 0.25), dur: 0.35, a: 0.03, d: 0.15, wave: "tri", vol: 0.35 })],

  // Switching off
  "off-drop": ["off", "a falling sine, 900 to 250 Hz, then a click", 0.7, (o) => { tone(o, 0, { f: (t) => 250 + 650 * Math.exp(-t / 0.15), dur: 0.6, a: 0.005, d: 0.25, vol: 0.45 }); noise(o, 0.6, { dur: 0.04, centre: 1500, q: 3, d: 0.006, vol: 0.6 }); }],
  "off-arp": ["off", "the boot arpeggio falling back down", 1, (o) => [84, 79, 76, 72].forEach((n, i) => tone(o, i * 0.09, { f: note(n), dur: 0.6, d: 0.2, wave: "tri", vol: 0.45 }))],
};

const dir = path.join(root, "public/local/sfx/guide");
const aud = path.join(root, "out/sfx/guide");
mkdirSync(dir, { recursive: true });
mkdirSync(aud, { recursive: true });

const wav = (x) => {
  const peak = x.reduce((m, s) => Math.max(m, Math.abs(s)), 1e-9);
  const g = 0.5 / peak; // every sound to -6 dBFS peak; the short sets each one's volume
  const b = Buffer.alloc(44 + x.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write("WAVE", 8);
  b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(x.length * 2, 40);
  x.forEach((s, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * g)) * 32767), 44 + i * 2));
  return b;
};

const inventory = { made: "scripts/guide-sfx.mjs", sounds: [] };
const list = [];
let clock = 0;
Object.entries(SOUNDS).forEach(([name, [role, what, sec, draw]], i) => {
  const x = buf(sec);
  draw(x);
  const file = path.join(dir, `${name}.wav`);
  const data = wav(x);
  writeFileSync(file, data);
  // In the audition: the number spoken, a short gap, the sound, a longer gap.
  const label = path.join(aud, `n${i + 1}.aiff`);
  execFileSync("say", ["-v", "Daniel", "-o", label, String(i + 1)]);
  const labelSec = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", label]).toString());
  const at = clock + labelSec + 0.35;
  clock = at + sec + 0.9;
  list.push({ label, file, sec });
  inventory.sounds.push({ n: i + 1, name, role, what, seconds: sec, audition: Number(at.toFixed(2)), sha256: createHash("sha256").update(data).digest("hex") });
  console.log(`${String(i + 1).padStart(2)}  ${at.toFixed(1).padStart(5)} s  ${name.padEnd(18)} ${what}`);
});

// Audition: label, 0.35 s, sound, 0.9 s, next.
const args = ["-loglevel", "error", "-y"];
list.forEach(({ label, file }) => args.push("-i", label, "-i", file));
const chains = list.map((_, i) => `[${2 * i}]aresample=44100,aformat=channel_layouts=mono,volume=0.5,apad=pad_dur=0.35[l${i}];[${2 * i + 1}]apad=pad_dur=0.9[s${i}];`).join("");
const joins = list.map((_, i) => `[l${i}][s${i}]`).join("");
args.push("-filter_complex", `${chains}${joins}concat=n=${list.length * 2}:v=0:a=1[o]`, "-map", "[o]", "-b:a", "192k", path.join(aud, "audition.m4a"));
execFileSync("ffmpeg", args);
writeFileSync(path.join(root, "series/specials/guide-sfx.json"), JSON.stringify(inventory, null, 1) + "\n");
console.log(`audition: out/sfx/guide/audition.m4a, ${clock.toFixed(1)} s`);
