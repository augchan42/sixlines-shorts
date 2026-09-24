import { hexagramClip } from "../lib/clips.ts";
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

// Screen 3 rotates by hexagram number so neighbouring shorts differ; ask always closes.
const THIRD = [
  { src: "assets/matrix-today.png", caption: "YOUR DAY, READ" },
  { src: "assets/matrix-journal.png", caption: "KEEP YOUR RECORDS" },
  { src: "assets/matrix-records.png", caption: "SIXTY-FOUR RECORDS" },
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
    screens: [
      { src: `assets/screens/${n}/reading.png`, caption: "READ THE STRUCTURE" },
      { src: `assets/screens/${n}/verse.png`, caption: "THE BOOK OF CHANGES" },
      THIRD[n % THIRD.length],
      { src: "assets/matrix-ask.png", caption: "ASK · CAST · REFLECT" },
    ],
    cta: "Reveal the moment.",
    url: "sixlines.day",
    ...override,
  };
  // The clip follows the merged tempo and drop, so an override that moves either gets its own clip.
  const beats = seriesPlan(merged.bpm, merged.drop).hexagramBeats;
  return { ...merged, hexagramClip: override.hexagramClip ?? hexagramClip(merged.hexagram.lines, merged.bpm, beats) };
};
