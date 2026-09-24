import { endcardClip, type EndcardMode, hexagramClip } from "../lib/clips.ts";
import { seriesPlan } from "../lib/seriesPlan.ts";
import type { SeriesProps } from "../schema.ts";

type Line = { text: string; source: string };

// A row of series/hexagrams.json (scripts/series/table.mjs).
export type SeriesRow = {
  number: number;
  zh: string;
  pinyin: string;
  name: string;
  lines: (0 | 1)[];
  upper: string;
  commentary: string;
  music: { trigram: string; file: string; bpm: number; start: number; firstBeat: number; drop: number; sha256?: string; certificate?: { file: string; sha256: string } };
  copy: { hook: Line; meaning: [Line, Line]; question: Line; plates: [string, string]; lineage?: string } | null;
  source: { sixlinesContent: string };
};

const plate = (key: string) => `assets/yilin/stipple-${key}.webp`;

// The end card's transition, by the energy of the upper trigram's track
// (docs/research/2026-09-24-transitions.md): the calm tracks join, the steady ones flip,
// and the ones that jump at the drop, or drive, snap every line shut on the downbeat.
const ENDCARD_MODE: Record<string, EndcardMode> = {
  kun: "join", gen: "join", qian: "flip", li: "flip", zhen: "snap", kan: "snap", xun: "snap", dui: "snap",
};

// Each hexagram's own screens, from the sixlines-ios galleries (scripts/series-screens.mjs).
// today is the Almanac on the day the hexagram rules (series/today-days.txt); painting and
// text are its Library page's Art and Study tabs.
const OWN = [
  { name: "reading", caption: "READ THE STRUCTURE" },
  { name: "verse", caption: "THE BOOK OF CHANGES" },
  { name: "today", caption: "YOUR DAY, READ" },
  { name: "painting", caption: "THE PAINTING" },
  { name: "text", caption: "THE TEXT, WORD BY WORD" },
];
// Screens every hexagram shares, from the sixlines-site tour (scripts/series-tour.mjs).
const SHARED = [
  { name: "ask", caption: "ASK · CAST · REFLECT" },
  { name: "dates", caption: "CHOOSE A DAY" },
  { name: "prove", caption: "WHAT WOULD PROVE IT WRONG" },
  { name: "archive", caption: "THE ARCHIVE" },
];
// The ten pairs of own screens. With the shared screen turning every 4 shorts and the pair
// every 10, no two neighbouring shorts show the same three.
const PAIRS = OWN.flatMap((a, i) => OWN.slice(i + 1).map((b) => [a, b]));

const screensFor = (n: number) => [
  ...PAIRS[(n - 1) % PAIRS.length].map((s) => ({ src: `assets/screens/${n}/${s.name}.png`, caption: s.caption })),
  { src: `assets/screens/tour/${SHARED[(n - 1) % SHARED.length].name}.png`, caption: SHARED[(n - 1) % SHARED.length].caption },
];

export const seriesProps = (row: SeriesRow, override: Partial<SeriesProps> = {}): SeriesProps => {
  if (!row.copy) throw new Error(`hexagram ${row.number} has no copy in series/copy.json`);
  const n = row.number;
  const merged = {
    hexagram: { number: n, zh: row.zh, pinyin: row.pinyin, name: row.name, lines: row.lines },
    bpm: row.music.bpm,
    firstBeat: row.music.firstBeat,
    music: `local/music/${row.music.file}`,
    musicStart: row.music.start,
    drop: row.music.drop,
    hook: row.copy.hook.text,
    meaning: [row.copy.meaning[0].text, row.copy.meaning[1].text] as [string, string],
    question: row.copy.question.text,
    plates: [plate(row.copy.plates[0]), plate(row.copy.plates[1])] as [string, string],
    screens: screensFor(n),
    ...override,
  };
  // The clips follow the merged tempo and drop, so an override that moves either gets its own clips.
  const plan = seriesPlan(merged.bpm, merged.drop);
  const mode = ENDCARD_MODE[row.upper];
  return {
    ...merged,
    hexagramClip: override.hexagramClip ?? hexagramClip(merged.hexagram.lines, merged.bpm, plan.hexagramBeats),
    endcard: override.endcard ?? { clip: endcardClip(merged.hexagram.lines, merged.bpm, plan.credit - plan.cta, mode), mode },
  };
};
