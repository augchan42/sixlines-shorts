// Checks each hexagram's music against its tone (series/tone.json): the key, mode and
// tempo of the part of the track it uses (music/mode.json, from music/mode.py). The user
// asked for this audit on 2026-09-26 after joyous tunes landed on 47 and 49. A flag is a
// reason to listen, not a verdict: the estimate is rough and pick06 at 98 s sounded joyous
// though it scored as a weak minor.
//
//   node scripts/music-audit.mjs     # prints the flags, writes series/music-audit.json
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const json = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"));

// What each tone wants: how minor at least, and how fast at most.
const WANTS = { dark: { minor: 0.05, bpm: 105 }, serious: { minor: 0, bpm: 115 } };

export const flags = (tone, section, bpm) => {
  const out = [];
  const want = WANTS[tone];
  if (want && section.minorMargin <= want.minor) out.push(`${section.key} (${section.minorMargin >= 0 ? "+" : ""}${section.minorMargin}) is not minor enough for a ${tone} hexagram`);
  if (want && bpm > want.bpm) out.push(`${bpm} bpm is fast for a ${tone} hexagram`);
  if (tone === "bright" && section.minorMargin > 0.15) out.push(`${section.key} (+${section.minorMargin}) may be too dark for a bright hexagram`);
  return out;
};

const main = () => {
  const rows = json("series/hexagrams.json");
  const { tones } = json("series/tone.json");
  const mode = json("music/mode.json").tracks;
  const audit = rows.map((r) => {
    const [tone, why] = tones[r.number];
    const section = mode.find((t) => t.file === r.music.file).sections.find((s) => s.start === r.music.start);
    return { number: r.number, name: r.name, tone, why, file: r.music.file, start: r.music.start, bpm: r.music.bpm, key: section.key, minorMargin: section.minorMargin, centroid: section.centroid, flags: flags(tone, section, r.music.bpm) };
  });
  writeFileSync(path.join(root, "series/music-audit.json"), JSON.stringify({ script: "scripts/music-audit.mjs", audit }, null, 1) + "\n");
  for (const a of audit.filter((a) => a.flags.length)) console.log(`${a.number} ${a.name} (${a.tone}) ${a.file.slice(0, 30)} @${a.start}: ${a.flags.join("; ")}`);
  console.log(`${audit.filter((a) => a.flags.length).length} of 64 flagged`);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
