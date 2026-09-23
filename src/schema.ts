import { z } from "zod";

// Everything a short needs. Durations are in beats so every cut lands on the music.
export const shortSchema = z.object({
  bpm: z.number().positive(),
  // Seconds from the start of the music to the first beat.
  firstBeat: z.number().min(0),
  // Path under public/, or null for a silent render.
  music: z.string().nullable(),
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
  art: z.array(z.string()).min(1),
  screens: z.array(z.string()).min(1),
  credit: z.string(),
  cta: z.string(),
});

export type ShortProps = z.infer<typeof shortSchema>;
