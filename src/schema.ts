import { z } from "zod";

// Everything a short needs. Durations are in beats so every cut lands on the music.
export const shortSchema = z.object({
  bpm: z.number().positive(),
  // Seconds from the start of the short to its first beat.
  firstBeat: z.number().min(0),
  // Path under public/, or null for a silent render.
  music: z.string().nullable(),
  // Seconds into the music file where the short starts.
  musicStart: z.number().min(0),
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
  hexagram: z.object({
    number: z.number().int().min(1).max(64),
    zh: z.string(),
    pinyin: z.string(),
    name: z.string(),
    // Bottom line first. 1 = solid (yang), 0 = broken (yin).
    lines: z.array(z.union([z.literal(0), z.literal(1)])).length(6),
  }),
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
