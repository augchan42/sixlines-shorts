import type { GotchuProps } from "../schema";
import { qian } from "./qian";

const plate = (key: string) => `assets/yilin/stipple-${key}.webp`;

// Recreates the structure of the 2026-09-23 20:40 short (sixlines-ios docs/videos/shorts)
// for hexagram 1, cut to Glowline, "Syncopation Heaven" (local only until Glowline agrees).
//
// Her track (~107 BPM) dips at 12–14.5s under "LETS CONTINUE.." and rebuilds into the
// showcase. Syncopation Heaven has the same shape from the top of the file: the bass
// drops out on beats 23–24 and the drop lands on beat 27 (15.29s). So the music starts at
// 0, the short's beats are the file's beats (110 BPM, first beat 0.56s), the code rain
// sits on beats 23–27, and the showcase starts on the drop.
export const gotchuQian: GotchuProps = {
  bpm: 110,
  firstBeat: 0.56,
  music: "local/syncopation-heaven.mp3",
  musicStart: 0,
  hook: "Like the I\u00a0Ching?",
  reply: "I gotchu 🥹",
  clock: { screen: "assets/matrix-verse.png", backdrop: plate("1-60") },
  verses: ["assets/matrix-yilin-1-1.png", "assets/matrix-yilin-1-9.png"],
  hexagram: qian.hexagram,
  breakdown: "LETS CONTINUE..",
  icon: qian.icon,
  captions: ["SIXTY-FOUR RECORDS", "READ THE STRUCTURE", "ASK · CAST · REFLECT", "THE BOOK OF CHANGES"],
  showcaseArt: [...qian.art.showcase, qian.art.finale],
  pattern: qian.pattern,
  run: qian.art.run,
  screens: [
    { src: "assets/matrix-reading.png", caption: "READ THE STRUCTURE" },
    { src: "assets/matrix-today.png", caption: "THE BOOK OF CHANGES" },
    { src: "assets/matrix-records.png", caption: "SIXTY-FOUR RECORDS" },
    { src: "assets/matrix-ask.png", caption: "ASK · CAST · REFLECT" },
  ],
  reveal: "Reveal the MOMENT..",
  credit: qian.credit,
  cta: qian.cta,
};
