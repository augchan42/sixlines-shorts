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
  // Typed over the code rain, which sits on the music's breakdown.
  breakdown: z.string(),
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
