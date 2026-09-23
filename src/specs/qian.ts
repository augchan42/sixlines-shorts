import type { ShortProps } from "../schema";

// Recreates the structure of the 2026-09-23 19:44 short (sixlines-ios docs/videos/shorts)
// for hexagram 1. Beat grid measured from that short's music: 129.8 BPM, first beat 0.42s.
export const qian: ShortProps = {
  bpm: 129.8,
  firstBeat: 0.42,
  music: "local/music.m4a",
  hook: "Best app?",
  rivals: [
    { label: "Doomscroll", glyph: "∞", from: "#ff2d55", to: "#ff9500" },
    { label: "Horoscope", glyph: "♌", from: "#5e5ce6", to: "#bf5af2" },
    { label: "Fortune", glyph: "✦", from: "#0a84ff", to: "#64d2ff" },
  ],
  verdict: "MOGGED",
  turn: "BUT THIS…",
  captions: ["THE BOOK OF CHANGES", "SIXTY-FOUR RECORDS", "ASK · CAST · REFLECT"],
  pattern: "A PATTERN TAKES SHAPE",
  hexagram: {
    number: 1,
    zh: "乾",
    pinyin: "Qián",
    name: "The Creative",
    lines: [1, 1, 1, 1, 1, 1],
  },
  icon: "assets/icon.png",
  art: ["assets/stipple-1-1.webp", "assets/ink-1-9.webp", "assets/stipple-1-9.webp", "assets/ink-1-1.webp"],
  screens: ["assets/screen-reading.png", "assets/screen-verse.png", "assets/screen-ask.png", "assets/screen-records.png"],
  credit: "~sixlines",
  cta: "Six Lines · on the App Store",
};
