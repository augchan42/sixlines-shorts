import type { ProtoProps } from "./SeriesProto";

// Shared app screens, used by 2 and 52 (made before per-hexagram screens were captured).
// From 29 on: this hexagram's reading and verse screens (sixlines-ios gallery capture,
// copied to public/assets/screens/N/), a third screen that varies, then ask.
const own = (n: number, third: { src: string; caption: string }) => [
  { src: `assets/screens/${n}/reading.png`, caption: "READ THE STRUCTURE" },
  { src: `assets/screens/${n}/verse.png`, caption: "THE BOOK OF CHANGES" },
  third,
  { src: "assets/matrix-ask.png", caption: "ASK · CAST · REFLECT" },
];

const screens = [
  { src: "assets/matrix-reading.png", caption: "READ THE STRUCTURE" },
  { src: "assets/matrix-today.png", caption: "THE BOOK OF CHANGES" },
  { src: "assets/matrix-records.png", caption: "SIXTY-FOUR RECORDS" },
  { src: "assets/matrix-ask.png", caption: "ASK · CAST · REFLECT" },
];

// Music: music/sections.json. Copy follows the spec's copy rules: hook (the viewer's
// situation), "<Name> says: …", why in everyday terms, then a question back to the viewer.
export const protos: { id: string; props: ProtoProps }[] = [
  {
    // Kun over Kun: the drop comes on beat 12, so the meaning follows it.
    id: "Proto2",
    props: {
      hexagram: { number: 2, zh: "坤", pinyin: "Kūn", name: "The Receptive", lines: [0, 0, 0, 0, 0, 0] },
      bpm: 90,
      music: "local/music/pick04-analog-dreams-synthwave.mp3",
      musicStart: 0,
      drop: 8.05,
      hook: "Tired of always having to lead?",
      meaning: ["The Receptive\nsays: follow well.", "Supporting is its\nown strength."],
      question: "Who could\nyou back?",
      plates: ["2-57", "2-2"],
      screens,
    },
  },
  {
    // Gen over Gen: 82.5 BPM, drop on beat 20, so the hexagram gets 6 beats.
    id: "Proto52",
    props: {
      hexagram: { number: 52, zh: "艮", pinyin: "Gèn", name: "Keeping Still", lines: [0, 0, 1, 0, 0, 1] },
      bpm: 82.5,
      music: "local/music/pick05-80s-retro-inspiring-synth-pop.mp3",
      musicStart: 34.934,
      drop: 14.54,
      hook: "Can't stop overthinking?",
      meaning: ["Keeping Still\nsays: pause.", "Stay with where\nyou are now."],
      question: "What can wait?",
      plates: ["52-51", "52-52"],
      screens,
    },
  },
  {
    // Kan over Kan: 100 BPM, drop on beat 24.
    id: "Proto29",
    props: {
      hexagram: { number: 29, zh: "坎", pinyin: "Kǎn", name: "The Abyss", lines: [0, 1, 0, 0, 1, 0] },
      bpm: 100,
      music: "local/music/pick09-synthwave.mp3",
      musicStart: 91.223,
      drop: 14.4,
      hook: "One problem after another?",
      meaning: ["The Abyss says:\nkeep moving.", "Like water: fill\nit, flow on."],
      question: "What's the next\nsmall step?",
      // A figure walking into the storm, then rushing water.
      plates: ["29-31", "29-60"],
      screens: own(29, { src: "assets/matrix-today.png", caption: "YOUR DAY, READ" }),
    },
  },
  {
    // Dui over Dui: 120 BPM, drop on beat 28.
    id: "Proto58",
    props: {
      hexagram: { number: 58, zh: "兌", pinyin: "Duì", name: "The Joyous", lines: [1, 1, 0, 1, 1, 0] },
      bpm: 120,
      music: "local/music/pick06-orbit-retrowaver-synthwave-vaporwave-ret.mp3",
      musicStart: 98.023,
      drop: 14.0,
      hook: "Good news, no one to tell?",
      meaning: ["The Joyous says:\nshare it.", "Joy kept alone\ndries up."],
      question: "Who could you\ncall today?",
      // Friends at a feast, then a lone swan on a dark lake.
      plates: ["58-19", "58-24"],
      screens: own(58, { src: "assets/matrix-journal.png", caption: "KEEP YOUR RECORDS" }),
    },
  },
];
