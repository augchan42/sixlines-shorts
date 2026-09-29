// The Wuyue video (docs/superpowers/specs/2026-09-29-wuyue-video-treatment.md, revised shot
// list): five Blender shots (blender/wuyue.py), cut together on the bar, with the text cards drawn
// over the video afterwards (so they stay level while the camera moves) and one track under it.
// The first version of this script rendered only the 11 s returning-route smoke test (64f1af5).
//
//   node scripts/wuyue.mjs [--cut vertical|wide] [--shot NAME] [--samples N] [--reuse] [--alone]
// writes out/wuyue/wuyue-vertical.mp4 (and -wide), H.264 yuv420p with faststart; each shot is
// kept as out/wuyue/shots/<cut>-<shot>.mp4, --shot renders one shot alone, and --reuse keeps
// shots already rendered. --shot NAME --alone also writes out/wuyue/<cut>-<shot>-alone.mp4: that
// shot with its cards and its stretch of the music, to look at on its own.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { keepIfComplete } from "./blender-output.mjs";

const FPS = 30;
export const BAR = 2.4; // seconds, at 100 bpm

// The reigns, 907 to 978 (docs/research/2026-09-29-wuyue-history.md, section 2).
export const REIGNS = [
  [907, 932], // Qian Liu
  [932, 941], // Qian Yuanguan
  [941, 947], // Qian Hongzuo
  [947, 948], // Qian Hongzong
  [948, 978], // Qian Chu
];

// The timeline's spans, `width` metres long centred on 0, a `gap` between reigns: [x0, x1] each.
export function timeline(width, gap) {
  const years = REIGNS.at(-1)[1] - REIGNS[0][0];
  const per = (width - gap * (REIGNS.length - 1)) / years;
  let x = -width / 2;
  return REIGNS.map(([a, b]) => {
    const span = [x, x + (b - a) * per];
    x = span[1] + gap;
    return span;
  });
}

// Each shot: its length in bars, its events in seconds from its start, and its text cards.
export const SHOTS = [
  {
    name: "hook",
    bars: 4,
    events: { back: [1.2, 5.0], flare: 5.0, rise: [5.6, 8.4] },
    cards: [
      { text: "Lost books.", from: 0.3, to: 2.6 },
      { text: "Copies from overseas.", from: 2.9, to: 5.3 },
      { text: "Wuyue ∙ Hangzhou, China\n907–978", from: 5.9, to: 9.6 },
    ],
  },
  {
    name: "family",
    bars: 5,
    events: { qian: [0.3, 3.6], reigns: [4.4, 8.6], crane: [3.0, 5.4] },
    cards: [
      { text: "Qian Liu: salt trader,\nsoldier, ruler.", from: 0.3, to: 4.2 },
      { text: "Five rulers. One family.\nSeventy-one years.", from: 4.6, to: 12 },
    ],
  },
  {
    name: "exchange",
    bars: 9,
    events: { north: [0.5, 3.6], places: [5.0, 6.6], widen: [1.0, 5.0], requests: [10.0, 13.6], back: [14.6, 19.2], flare: 19.2 },
    cards: [
      { text: "Tribute north.\nTrade by sea.", from: 0.3, to: 4.6 },
      { text: "Some Tiantai Buddhist texts\nwere lost in China.", from: 5.0, to: 9.6 },
      { text: "Qian Chu sent overseas\nfor copies.", from: 10.0, to: 14.2 },
      { text: "A Korean monk, Chegwan,\nbrought them back.", from: 14.6, to: 21.6 },
    ],
  },
  {
    name: "printing",
    bars: 7,
    events: { page: [0.3, 1.8], build: [2.6, 6.6], flare: 7.2, orbit: [4.4, 9.6], spread: [9.6, 14.4], rise: [9.6, 15.6] },
    cards: [
      { text: "Qian Chu had the Baoqieyin\nDharani printed.", from: 0.3, to: 4.3 },
      { text: "The sutra says a stupa with it\nhas the relics of every Buddha.", from: 4.8, to: 9.1 },
      { text: "It is said 84,000 small stupas\nwere made to hold the copies.", from: 9.6, to: 13.2 },
      { text: "Copies dated 956 and 965\nsurvive today.", from: 13.6, to: 16.8 },
    ],
  },
  {
    name: "leifeng",
    bars: 3,
    events: { rise: [0.3, 3.0] },
    cards: [{ text: "Leifeng Pagoda, by West Lake,\ndedicated in 975.", from: 0.3, to: 6.8 }],
  },
  {
    name: "surrender",
    bars: 3,
    events: { border: [1.0, 4.0] },
    cards: [{ text: "978: Qian Chu surrendered\nWuyue to the Song.", from: 0.3, to: 6.8 }],
  },
  {
    name: "vault",
    bars: 7,
    events: { fade: [1.5, 3.5], descend: [3.0, 7.0], case: [5.5, 6.6], build: [6.0, 9.0], flare: 9.6, relic: 11.0 },
    cards: [
      { text: "It collapsed in 1924.", from: 0.3, to: 2.9 },
      { text: "Copies of the 975 printing\nwere found in its bricks.", from: 3.2, to: 6.4 },
      { text: "In 2001 its vault was opened.\nA gilt silver stupa was inside.", from: 6.8, to: 10.4 },
      { text: "A gold casket inside held a hair\nrevered as the Buddha’s.", from: 10.8, to: 16.8 },
    ],
  },
  {
    name: "end",
    bars: 3,
    events: { descend: [0.3, 3.6], flare: 4.8, labels: [5.0, 6.2] },
    cards: [],
  },
];

// Each cut: its frame, the map (metres from Hangzhou's sign; a character is about 10 m wide),
// and the text's size and height in the frame. Korea lies north-east, Japan east of it.
export const CUTS = {
  vertical: { size: [1080, 1920], korea: [16, 50], japan: [32, 28], north: [0, 34], fontsize: 58, y: 0.08 },
  wide: { size: [1920, 1080], korea: [42, 30], japan: [66, 8], north: [0, 30], fontsize: 52, y: 0.07 },
};

// The sources card closing the wide cut, for the friend's site.
export const SOURCES = [
  "Sources",
  "Encyclopedia of Buddhism: Chegwan",
  "Religions 12.1 (2021): the Baoqieyin prints",
  "Zhejiang Provincial Museum: the Leifeng silver stupa",
  "Wikipedia: Wuyue, Qian Liu, Qian Chu, Leifeng Pagoda",
  "chinaknowledge.de: the rulers of Wu-Yue",
];

// ffmpeg drawtext for the cards: each line of a card under the one before, centred, fading in
// and out over 0.4 s, outlined in black so it reads over the field of pages. Each line is read from its own file under `dir` (ffmpeg strips a level of
// quoting before it reads options, so a colon or comma in quoted text breaks the filter);
// returns the filter and the [file, text] pairs to write. Apostrophes become typographic ones.
export function cardsFilter(cards, cut, font, dir, offset = 0) {
  const [, h] = cut.size;
  const step = Math.round(cut.fontsize * 1.3);
  const files = [];
  const filter = cards
    .flatMap(({ text, from, to }) => {
      const [a, b] = [from + offset, to + offset].map((v) => +v.toFixed(3));
      const alpha = `if(lt(t,${+(a + 0.4).toFixed(3)}),(t-${a})/0.4,if(gt(t,${+(b - 0.4).toFixed(3)}),(${b}-t)/0.4,1))`;
      return text.split("\n").map((line, i) => {
        const file = path.join(dir, `card-${files.length}-${a}.txt`);
        files.push([file, line.replaceAll("'", "’")]);
        return (
          `drawtext=fontfile='${font}':textfile='${file}':fontsize=${cut.fontsize}:fontcolor=0xdcd2d8:borderw=3:bordercolor=black@0.7` +
          `:x=(w-text_w)/2:y=${Math.round(h * cut.y) + i * step}:alpha='${alpha}':enable='between(t,${a},${b})'`
        );
      });
    })
    .join(",");
  return { filter, files };
}

// Where to start the track so the exchange's flare lands on its drop.
export function musicStart(music) {
  const i = SHOTS.findIndex((s) => s.name === "exchange");
  const flareAt = SHOTS.slice(0, i).reduce((t, s) => t + s.bars * BAR, 0) + SHOTS[i].events.flare;
  return music.start + music.drop - flareAt;
}

const frames = (bars) => Math.round(bars * BAR * FPS);

// The video bitrate (kbit/s) that brings `secs` of video with 192 kbit/s audio under `mb` MB,
// leaving 3% for the container.
export function fitBitrate(secs, mb = 24) {
  return Math.floor((mb * 8e3 * 0.97) / secs - 192);
}

export function fitInstagram(file, secs, root) {
  const { size } = statSync(file);
  if (size <= 24e6) return;
  const tmp = file.replace(/\.mp4$/, "-fit.mp4");
  const log = path.join(root, "out/wuyue/partial/fit");
  const rate = `${fitBitrate(secs)}k`;
  for (const pass of [1, 2]) {
    const run = spawnSync("ffmpeg", [
      "-y", "-v", "error", "-i", file, "-c:v", "libx264", "-b:v", rate, "-preset", "slow", "-pix_fmt", "yuv420p",
      "-pass", String(pass), "-passlogfile", log,
      ...(pass === 1 ? ["-an", "-f", "mp4", "/dev/null"] : ["-c:a", "copy", "-movflags", "+faststart", tmp]),
    ], { stdio: "inherit" });
    if (run.status !== 0) (console.error("ffmpeg failed fitting for Instagram"), process.exit(1));
  }
  renameSync(tmp, file);
  console.log(`fitted ${path.relative(root, file)} to ${(statSync(file).size / 1e6).toFixed(1)} MB at ${rate}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = path.resolve(import.meta.dirname, "..");
  const blender = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";
  const font = path.join(root, "public/local/fonts/goudos.ttf");
  const { values: a } = parseArgs({ options: { cut: { type: "string" }, shot: { type: "string" }, samples: { type: "string" }, reuse: { type: "boolean", default: false }, alone: { type: "boolean", default: false } } });
  // Duration's calm section of Interstellar Retrowave (100 bpm, A minor).
  const music = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8")).find((r) => r.number === 32).music;
  const hanzi = (c) => path.join(root, "public/local/hanzi", `${c}.json`);
  for (const c of "吳越高麗日本錢") {
    if (existsSync(hanzi(c))) continue;
    const got = spawnSync("node", [path.join(root, "scripts/character.mjs"), c], { stdio: "inherit" });
    if (got.status !== 0) process.exit(1);
  }
  const probe = (f) =>
    Number(execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", f], { encoding: "utf8" }).trim());

  for (const name of a.cut ? [a.cut] : Object.keys(CUTS)) {
    const cut = CUTS[name];
    const shots = a.shot ? SHOTS.filter((s) => s.name === a.shot) : SHOTS;
    const done = [];
    for (const shot of shots) {
      const out = path.join(root, "out/wuyue/shots", `${name}-${shot.name}.mp4`);
      if (a.reuse && existsSync(out)) {
        done.push(out);
        continue;
      }
      const partial = path.join(root, "out/wuyue/partial", `${name}-${shot.name}.mp4`);
      mkdirSync(path.dirname(partial), { recursive: true });
      rmSync(partial, { force: true });
      const timing = { frames: frames(shot.bars), ...Object.fromEntries(Object.entries(shot.events).map(([k, v]) => [k, Array.isArray(v) ? v.map((s) => Math.round(s * FPS)) : Math.round(v * FPS)])) };
      const t0 = Date.now();
      const run = spawnSync(
        blender,
        [
          "-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/wuyue.py"), "--",
          "--shot", shot.name, "--hanzi", path.join(root, "public/local/hanzi"), "--font", font,
          "--map", JSON.stringify({ korea: cut.korea, japan: cut.japan, north: cut.north }),
          "--timeline", JSON.stringify(timeline(16, 0.25)),
          "--timing", JSON.stringify(timing), "--width", String(cut.size[0]), "--height", String(cut.size[1]),
          ...(a.samples ? ["--samples", a.samples] : []), "--out", partial,
        ],
        { stdio: ["ignore", "ignore", "inherit"] },
      );
      if (run.status !== 0 || !existsSync(partial)) (console.error(`Blender failed on ${shot.name} (exit ${run.status})`), process.exit(1));
      const got = probe(partial);
      if (!keepIfComplete({ partial, out, frames: got, expected: timing.frames })) (console.error(`${shot.name}: ${got} frames; expected ${timing.frames}.`), process.exit(1));
      console.log(`wrote ${path.relative(root, out)} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
      done.push(out);
    }
    if (a.shot && !a.alone) continue;

    // Cut together, the cards over it, the sources card closing the wide cut, and the music.
    const list = path.join(root, "out/wuyue/partial", `${name}.txt`);
    writeFileSync(list, done.map((f) => `file '${f}'`).join("\n") + "\n");
    const dir = path.join(root, "out/wuyue/partial", `cards-${name}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    let at = 0;
    const filters = [];
    const card = (cards, c, offset) => {
      const { filter, files } = cardsFilter(cards, c, font, dir, offset);
      for (const [f, text] of files) writeFileSync(f, text);
      if (filter) filters.push(filter);
    };
    for (const s of shots) {
      card(s.cards, cut, at);
      at += s.bars * BAR;
    }
    const tail = name === "wide" && !a.shot ? 6 : 0;
    const secs = at + tail;
    if (tail) card([{ text: SOURCES.join("\n"), from: 0.3, to: tail }], { ...cut, fontsize: 36, y: 0.32 }, at);
    const out = path.join(root, "out/wuyue", a.shot ? `${name}-${a.shot}-alone.mp4` : `wuyue-${name}.mp4`);
    const before = SHOTS.slice(0, SHOTS.findIndex((s) => s === shots[0])).reduce((t, s) => t + s.bars * BAR, 0);
    const mux = spawnSync("ffmpeg", [
      "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list,
      "-ss", (musicStart(music) + before).toFixed(3), "-i", path.join(root, "public/local/music", music.file),
      "-filter_complex",
      `[0:v]${[`tpad=stop_duration=${tail}:color=black`, ...filters].join(",")}[v];` +
        `[1:a]atrim=duration=${secs},afade=t=in:st=0:d=${a.shot ? 0.3 : 1},afade=t=out:st=${secs - 3}:d=3[a]`,
      "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", String(secs), out,
    ], { stdio: "inherit" });
    if (mux.status !== 0) (console.error("ffmpeg failed"), process.exit(1));
    console.log(`wrote ${path.relative(root, out)}`);
    // Instagram takes files under 25 MB: over 24 MB, re-encode the video to fit (two passes).
    if (name === "vertical" && !a.shot) fitInstagram(out, secs, root);
  }
}
