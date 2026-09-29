// The Wuyue video's smoke test (docs/superpowers/specs/2026-09-29-wuyue-video-treatment.md, and
// Astra's review in docs/research/2026-09-29-codex-wuyue-video.md): 11 s of the returning route.
// The finished 吳越 sign lies lit on the floor; a magenta line draws out to the north-east; 高麗
// (Goryeo, Korea) traces in cyan-white; a cyan-white line draws back, and the sign flares once
// as it arrives; the camera starts low and close and ends over the whole map. Text cards are
// drawn over the video afterwards, so they stay level and readable while the camera moves.
//
//   node scripts/wuyue.mjs [--cut vertical|wide] [--samples N]
// writes out/wuyue/route-vertical.mp4 (and -wide), H.264 yuv420p with faststart.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { keepIfComplete } from "./blender-output.mjs";

const FPS = 30;

// Seconds: the outward line, the far shore tracing in, the line home.
const seconds = { out: [1.5, 4], shore: [4, 5.3], back: [5.5, 8] };
export const ROUTE = {
  seconds,
  frames: 11 * FPS,
  flare: Math.round(seconds.back[1] * FPS),
  cards: [
    { text: "Lost books.", from: 0.3, to: 2.8 },
    { text: "Copies overseas.", from: 3.1, to: 6.2 },
    { text: "Wuyue ∙ Hangzhou, China ∙ 907–978", from: 8.3, to: 11 },
  ],
};

// Each cut: its frame, where the far shore lies from Hangzhou (metres; a character is about 10
// m wide), and the text's size and height in the frame.
export const CUTS = {
  vertical: { size: [1080, 1920], shore: [26, 44], fontsize: 58, y: 0.1 },
  wide: { size: [1920, 1080], shore: [48, 20], fontsize: 52, y: 0.08 },
};

// ffmpeg drawtext for the cards, fading in and out over 0.4 s. Apostrophes become typographic
// ones, so the text needs no escaping inside its quotes.
export function cardsFilter(cards, cut, font) {
  const [, h] = cut.size;
  return cards
    .map(({ text, from, to }) => {
      const alpha = `if(lt(t,${from + 0.4}),(t-${from})/0.4,if(gt(t,${to - 0.4}),(${to}-t)/0.4,1))`;
      return (
        `drawtext=fontfile='${font}':text='${text.replaceAll("'", "’")}':fontsize=${cut.fontsize}:fontcolor=0xdcd2d8` +
        `:x=(w-text_w)/2:y=${Math.round(h * cut.y)}:alpha='${alpha}':enable='between(t,${from},${to})'`
      );
    })
    .join(",");
}

// Where to start the track so the line comes home (at `home` seconds) on its drop.
export const musicStart = (music, home) => music.start + music.drop - home;

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = path.resolve(import.meta.dirname, "..");
  const blender = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";
  const { values: a } = parseArgs({ options: { cut: { type: "string" }, samples: { type: "string" } } });
  // Duration's calm section of Interstellar Retrowave (100 bpm, A minor).
  const music = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8")).find((r) => r.number === 32).music;
  const hanzi = (c) => path.join(root, "public/local/hanzi", `${c}.json`);
  for (const c of "吳越高麗") {
    if (existsSync(hanzi(c))) continue;
    const got = spawnSync("node", [path.join(root, "scripts/character.mjs"), c], { stdio: "inherit" });
    if (got.status !== 0) process.exit(1);
  }
  for (const name of a.cut ? [a.cut] : Object.keys(CUTS)) {
    const cut = CUTS[name];
    const out = path.join(root, "out/wuyue", `route-${name}.mp4`);
    const partial = path.join(root, "out/wuyue/partial", `route-${name}.mp4`);
    mkdirSync(path.dirname(partial), { recursive: true });
    rmSync(partial, { force: true });
    const timing = { frames: ROUTE.frames, flare: ROUTE.flare, ...Object.fromEntries(Object.entries(seconds).map(([k, [s, e]]) => [k, [Math.round(s * FPS), Math.round(e * FPS)]])) };
    const t0 = Date.now();
    const run = spawnSync(
      blender,
      [
        "-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/wuyue.py"), "--",
        "--home", [hanzi("吳"), hanzi("越")].join(","), "--shore", [hanzi("高"), hanzi("麗")].join(","),
        "--at", cut.shore.join(","), "--font", path.join(root, "public/local/fonts/goudos.ttf"),
        "--timing", JSON.stringify(timing), "--width", String(cut.size[0]), "--height", String(cut.size[1]),
        ...(a.samples ? ["--samples", a.samples] : []), "--out", partial,
      ],
      { stdio: ["ignore", "ignore", "inherit"] },
    );
    if (run.status !== 0 || !existsSync(partial)) (console.error(`Blender failed (exit ${run.status})`), process.exit(1));
    const frames = Number(
      execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", partial], { encoding: "utf8" }).trim(),
    );
    const silent = partial.replace(/\.mp4$/, "-silent.mp4");
    if (!keepIfComplete({ partial, out: silent, frames, expected: ROUTE.frames })) (console.error(`The render had ${frames} frames; expected ${ROUTE.frames}.`), process.exit(1));
    const secs = ROUTE.frames / FPS;
    const mux = spawnSync("ffmpeg", [
      "-y", "-v", "error", "-i", silent, "-ss", musicStart(music, seconds.back[1]).toFixed(3), "-i", path.join(root, "public/local/music", music.file),
      "-filter_complex",
      `[0:v]${cardsFilter(ROUTE.cards, cut, path.join(root, "public/local/fonts/goudos.ttf"))}[v];[1:a]atrim=duration=${secs},afade=t=in:st=0:d=1,afade=t=out:st=${secs - 2}:d=2[a]`,
      "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out,
    ], { stdio: "inherit" });
    rmSync(silent, { force: true });
    if (mux.status !== 0) (console.error("ffmpeg failed"), process.exit(1));
    console.log(`wrote ${path.relative(root, out)} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}
