import type { ProtoProps } from "./SeriesProto";

// Shared app screens: only hexagram 1's reading and verse screens exist so far, so these
// prototypes use the screens that do not depend on the hexagram.
const screens = [
  { src: "assets/matrix-reading.png", caption: "READ THE STRUCTURE" },
  { src: "assets/matrix-today.png", caption: "THE BOOK OF CHANGES" },
  { src: "assets/matrix-records.png", caption: "SIXTY-FOUR RECORDS" },
  { src: "assets/matrix-ask.png", caption: "ASK · CAST · REFLECT" },
];

// Music: music/sections.json. Copy: sixlines-content commentary/en/N.json (judgment and
// image synthesis), fd827b1.
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
      hook: "What if following is the hard part?",
      meaning: ["The mare covers\nmore ground.", "She just doesn't\npick where."],
      question: "What are you\nholding?",
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
      hook: "Is stopping ever the right move?",
      meaning: ["Still the back,\nnot the front.", "Think no further\nthan here."],
      question: "Where would\nyou stop?",
      plates: ["52-51", "52-52"],
      screens,
    },
  },
];
