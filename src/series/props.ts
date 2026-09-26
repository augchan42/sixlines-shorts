import { characterClip, endcardClip, type EndcardMode, hexagramClip, moonClip, sceneClip } from "../lib/clips.ts";
import { planOf } from "../lib/seriesPlan.ts";
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
  copy: {
    hook: Line;
    meaning: [Line, Line];
    question: Line;
    plates: [string, string];
    lineage?: string;
    lesson?: Line & {
      kind: "lines" | "judgment" | "painting" | "moon" | "character";
      credit?: string;
      painting?: string;
      labels?: string[];
      // A character lesson's drawing, as in series/characters.json.
      character?: { char: string; beats: number; args: Record<string, unknown> };
      // A Judgment or trigram lesson acted out in Blender: blender/glyphs.py or blender/trigram.py
      // with these settings (scripts/lesson3d.mjs), in place of the Library page or the 2D trigrams.
      scene?: { script: "glyphs" | "trigram" | "collapse" | "focus" | "bite"; args: Record<string, unknown> };
      // A readout lesson (src/scenes/Readout.tsx): the lines to mark and what it finds there.
      readout?: { mark: number[]; finding?: string };
    };
    // false leaves out the ~DISNEYFAN credit (a special).
    credit?: boolean;
    tags?: string[];
    pace?: "even" | "held";
  } | null;
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
// text are its Library page's Art and Study tabs, scrolled so the painting or Judgment fills the screen.
const OWN = [
  { name: "reading", caption: "READ THE STRUCTURE" },
  { name: "verse", caption: "THE BOOK OF CHANGES" },
  { name: "today", caption: "YOUR DAY, READ" },
  { name: "painting-scrolled", caption: "THE PAINTING" },
  { name: "text-scrolled", caption: "THE TEXT, WORD BY WORD" },
];
// Screens every hexagram shares, from the sixlines-site tour (scripts/series-tour.mjs).
const SHARED = [
  { name: "ask", caption: "ASK · CAST · REFLECT" },
  { name: "dates", caption: "CHOOSE A DAY" },
  { name: "prove", caption: "PROVE IT WRONG" },
  { name: "archive", caption: "THE ARCHIVE" },
];
// The ten pairs of own screens. With the shared screen turning every 4 shorts and the pair
// every 10, no two neighbouring shorts show the same three.
const PAIRS = OWN.flatMap((a, i) => OWN.slice(i + 1).map((b) => [a, b]));

const screensFor = (n: number) => [
  ...PAIRS[(n - 1) % PAIRS.length].map((s) => ({ src: `assets/screens/${n}/${s.name}.png`, caption: s.caption })),
  { src: `assets/screens/tour/${SHARED[(n - 1) % SHARED.length].name}.png`, caption: SHARED[(n - 1) % SHARED.length].caption },
];

// Each trigram by its lines, bottom first, with its image in Chinese and English.
const TRIGRAMS: Record<string, { zh: string; name: string }> = {
  "111": { zh: "天", name: "HEAVEN" },
  "000": { zh: "地", name: "EARTH" },
  "100": { zh: "雷", name: "THUNDER" },
  "010": { zh: "水", name: "WATER" },
  "001": { zh: "山", name: "MOUNTAIN" },
  "011": { zh: "風", name: "WIND" },
  "101": { zh: "火", name: "FIRE" },
  "110": { zh: "澤", name: "LAKE" },
};

// The Library page each lesson shows: the Study tab's Judgment or the Art tab's painting.
const LESSON_SCREENS = {
  judgment: { name: "text-scrolled", caption: "THE JUDGMENT" },
  painting: { name: "painting-scrolled", caption: "THE PAINTING" },
};

// After a character is drawn, the camera holds over it: a beat to see it, then 3 for the sentence.
export const CHARACTER_HOLD_BEATS = 4;

const lessonFor = (row: SeriesRow): SeriesProps["lesson"] => {
  const l = row.copy?.lesson;
  if (!l) return undefined;
  // The moon is its own Blender clip (blender/moon.py), rendered once the plan is known.
  if (l.kind === "moon") return { kind: l.kind, text: l.text, ...(l.labels ? { labels: l.labels } : {}) };
  // A character is drawn by blender/character.py, then held while the sentence is typed.
  if (l.kind === "character") {
    if (!l.character) throw new Error(`hexagram ${row.number}'s character lesson has no character`);
    return { kind: l.kind, text: l.text, beats: l.character.beats + CHARACTER_HOLD_BEATS };
  }
  const [lower, upper] = [row.lines.slice(0, 3), row.lines.slice(3)].map((t) => TRIGRAMS[t.join("")]);
  // A readout plays for the whole lesson and types the sentence itself.
  if (l.readout) return { kind: l.kind, text: l.text, trigrams: [upper, lower], readout: l.readout };
  // A Blender scene plays for the whole lesson, the sentence typed under its end.
  if (l.scene) return { kind: l.kind, text: l.text, scene: l.scene.script };
  if (l.kind === "lines") {
    return { kind: l.kind, text: l.text, trigrams: [upper, lower] };
  }
  // A special's painting has its own key in series/paintings.json; the app pairs another
  // painting with the hexagram, so its Library page is left out.
  if (l.kind === "painting" && l.painting) return { kind: l.kind, text: l.text, painting: { src: `assets/paintings/${l.painting}.jpg`, credit: l.credit ?? "" } };
  const s = LESSON_SCREENS[l.kind];
  const screen = { src: `assets/screens/${row.number}/${s.name}.png`, caption: s.caption };
  // The painting's file comes from scripts/series-paintings.mjs (series/paintings.json).
  if (l.kind === "painting") return { kind: l.kind, text: l.text, screen, painting: { src: `assets/paintings/${row.number}.jpg`, credit: l.credit ?? "" } };
  return { kind: l.kind, text: l.text, screen };
};

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
    screens: row.copy.lesson ? [] : screensFor(n),
    lesson: lessonFor(row),
    pace: row.copy.pace ?? "even",
    credit: row.copy.credit ?? true,
    ...override,
  };
  // The clips follow the merged tempo and drop, so an override that moves either gets its own clips.
  const plan = planOf(merged);
  const mode = ENDCARD_MODE[row.upper];
  const clip = (l: NonNullable<SeriesProps["lesson"]>) => {
    if (l.kind === "moon") return moonClip(merged.hexagram.lines, merged.bpm, plan.cta - plan.showcase, l.labels);
    if (l.kind === "character") return characterClip(n, merged.bpm, plan.cta - plan.showcase, row.copy!.lesson!.character!.args);
    const scene = row.copy!.lesson!.scene;
    if (scene) return sceneClip(n, scene.script, merged.bpm, plan.cta - plan.showcase, scene.args);
    return undefined;
  };
  const lessonClip = merged.lesson && clip(merged.lesson);
  const lesson = lessonClip ? { ...merged.lesson!, clip: lessonClip } : merged.lesson;
  return {
    ...merged,
    lesson,
    hexagramClip: override.hexagramClip ?? hexagramClip(merged.hexagram.lines, merged.bpm, plan.hexagramBeats),
    endcard: override.endcard ?? { clip: endcardClip(merged.hexagram.lines, merged.bpm, plan.credit - plan.cta, mode), mode },
  };
};
