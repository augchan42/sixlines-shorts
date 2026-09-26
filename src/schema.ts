import { z } from "zod";

export const hexagramSchema = z.object({
  number: z.number().int().min(1).max(64),
  zh: z.string(),
  pinyin: z.string(),
  name: z.string(),
  // Bottom line first. 1 = solid (yang), 0 = broken (yin).
  lines: z.array(z.union([z.literal(0), z.literal(1)])).length(6),
});

// Music and its beat grid, shared by every template.
const music = {
  bpm: z.number().positive(),
  // Seconds from the start of the short to its first beat.
  firstBeat: z.number().min(0),
  // Path under public/, or null for a silent render.
  music: z.string().nullable(),
  // Seconds into the music file where the short starts.
  musicStart: z.number().min(0),
};

// Everything a short needs. Durations are in beats so every cut lands on the music.
export const shortSchema = z.object({
  ...music,
  hook: z.string(),
  rivals: z.array(
    z.object({
      label: z.string(),
      glyph: z.string(),
      from: z.string(),
      to: z.string(),
    }),
  ),
  verdict: z.string(),
  turn: z.string(),
  captions: z.array(z.string()).min(1),
  pattern: z.string(),
  hexagram: hexagramSchema,
  icon: z.string(),
  // Stipple Yilin plates by where they appear. Paths under public/.
  art: z.object({
    // Colour halftone behind the icon, one every two beats.
    showcase: z.array(z.string()).min(1),
    // Full colour under the pattern line, one every half-beat.
    run: z.array(z.string()).min(1),
    // Green halftone behind the app screens.
    screens: z.array(z.string()).min(1),
    // Full colour, pixel-dissolves into the white flash.
    finale: z.string(),
  }),
  screens: z.array(z.string()).min(1),
  credit: z.string(),
  cta: z.string(),
});

export type ShortProps = z.infer<typeof shortSchema>;

// The "I gotchu" short: a question and a reply, the app inside a clock, Yilin screens,
// the hexagram, code rain into the drop, the icon showcase, a plate run, captioned
// screens, and a starfield line before the end card.
export const gotchuSchema = z.object({
  ...music,
  hook: z.string(),
  reply: z.string(),
  clock: z.object({ screen: z.string(), backdrop: z.string() }),
  // Full-bleed Yilin verse screens, four beats each.
  verses: z.array(z.string()).min(1),
  hexagram: hexagramSchema,
  // The Blender hexagram build (npm run blender), under public/. Without it the 2D build plays.
  hexagramClip: z.string().optional(),
  // Typed over the code rain, which sits on the music's breakdown.
  breakdown: z.string(),
  // Full-bleed plates that cut in on the hits inside the breakdown, one per hit.
  breakdownArt: z.array(z.string()).min(1),
  icon: z.string(),
  captions: z.array(z.string()).min(1),
  showcaseArt: z.array(z.string()).min(1),
  pattern: z.string(),
  run: z.array(z.string()).min(1),
  screens: z.array(z.object({ src: z.string(), caption: z.string() })).min(1),
  reveal: z.string(),
  credit: z.string(),
  cta: z.string(),
  // Accents in the music, in beats: each punches the camera and flashes the frame.
  hits: z.array(z.number()),
});

export type GotchuProps = z.infer<typeof gotchuSchema>;

// One short of the Sixty-Four Records series (src/templates/Series.tsx), built from a row of
// series/hexagrams.json by src/series/props.ts.
export const seriesSchema = z.object({
  hexagram: hexagramSchema,
  bpm: z.number().positive(),
  firstBeat: z.number().min(0),
  music: z.string(),
  musicStart: z.number().min(0),
  // Seconds from musicStart to the drop.
  drop: z.number().positive(),
  hexagramClip: z.string(),
  hook: z.string(),
  meaning: z.tuple([z.string(), z.string()]),
  question: z.string(),
  // Paths under public/ of the plates behind the two meaning lines.
  plates: z.tuple([z.string(), z.string()]),
  // The app screens after the drop; empty when the short has a lesson instead.
  screens: z.array(z.object({ src: z.string(), caption: z.string() })),
  // What lands on the drop in place of the showcase: the two trigrams, the Judgment on the
  // Library's Study page, or the painting on its Art page, then one plain sentence.
  lesson: z
    .object({
      kind: z.enum(["lines", "judgment", "painting", "moon", "character"]),
      text: z.string(),
      trigrams: z.tuple([z.object({ zh: z.string(), name: z.string() }), z.object({ zh: z.string(), name: z.string() })]).optional(),
      screen: z.object({ src: z.string(), caption: z.string() }).optional(),
      // A painting lesson opens on the painting itself, full-frame, with its credit.
      painting: z.object({ src: z.string(), credit: z.string() }).optional(),
      // A moon lesson plays its Blender clip (blender/moon.py) for the whole lesson, the
      // sentence typed over its end; the labels light up on the hexagram's lines.
      clip: z.string().optional(),
      // The Blender script of a lesson acted out in a scene (blender/glyphs.py, trigram.py,
      // collapse.py); such a scene carries its own searchlight.
      scene: z.string().optional(),
      // A lesson as a ship's computer readout (src/scenes/Readout.tsx): the lines plotted and
      // logged, the trigrams named, these lines marked with the finding, the sentence typed.
      readout: z.object({ mark: z.array(z.number().int().min(0).max(5)), finding: z.string().optional(), master: z.object({ zh: z.string(), en: z.string() }).optional() }).optional(),
      labels: z.array(z.string()).length(6).optional(),
      // A character lesson (blender/character.py) sets its own length: its drawing, then 3
      // beats for the sentence under the finished character.
      beats: z.number().int().positive().optional(),
    })
    .optional(),
  // "held": both meaning lines on one card and a longer question (src/lib/seriesPlan.ts).
  pace: z.enum(["even", "held"]),
  // The ~DISNEYFAN credit after the end card; a special leaves it out.
  credit: z.boolean(),
  // The Blender end card (blender/endcard.py), which carries the tagline and site itself.
  endcard: z.object({ clip: z.string(), mode: z.enum(["join", "flip", "snap"]) }),
});

export type SeriesProps = z.infer<typeof seriesSchema>;
