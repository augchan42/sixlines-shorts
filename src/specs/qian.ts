import type { ShortProps } from "../schema";

const plate = (key: string) => `assets/yilin/stipple-${key}.webp`;

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
  // Stipple Yilin plates (the Matrix skin's artwork), picked from 1-1 to 1-64 toward the
  // mystical styles with a spread of colour: cosmic-night for the showcase; atmospheric-night,
  // figures-in-mist and ink-landscape for the run. Style per plate: sixlines-content
  // content/yilin/gloss-prompt/01.json.
  art: {
    showcase: ["1-9", "1-44", "1-17", "1-14", "1-48", "1-60", "1-55"].map(plate),
    run: ["1-40", "1-31", "1-24", "1-53", "1-16", "1-27", "1-37", "1-56"].map(plate),
    screens: ["1-22", "1-8", "1-18", "1-3"].map(plate),
    finale: plate("1-12"),
  },
  screens: ["assets/matrix-reading.png", "assets/matrix-yilin-1-1.png", "assets/matrix-ask.png", "assets/matrix-records.png"],
  credit: "~sixlines",
  cta: "Six Lines · on the App Store",
};
