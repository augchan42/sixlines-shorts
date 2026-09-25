import type { SeriesPlan } from "./seriesPlan";

// How the frame moves through a series short (src/fx/Camera.tsx). The camera keeps still
// while there is text to read (hook, meaning, question, a lesson's sentence) and moves on
// the accents: the drop's burst of shake, the beat punches over a lesson's picture or the
// showcase, and the cuts. Shake on whole sections is distracting and hard on people with
// motion sensitivity (docs/adr/ADR-SHORTS-001-camera-still-over-text.md).
export const seriesMotion = (s: SeriesPlan, lesson?: { clip?: string }) => {
  // Where a lesson's sentence comes on: over the last 5 beats of a moon clip, else halfway.
  const sentence = lesson ? (lesson.clip ? s.cta - 5 : s.showcase + (s.cta - s.showcase) / 2) : null;
  return {
    motion: [
      { beat: -10, punch: 0, sway: 0.15 },
      { beat: s.hexagram, punch: 0, sway: 0.3 },
      { beat: s.meaning, punch: 0, sway: 0.15 },
      { beat: s.question, punch: 0, sway: 0.1 },
      { beat: s.drop, punch: 0.03, sway: 0.3 },
      ...(sentence === null ? [] : [{ beat: sentence, punch: 0, sway: 0.1 }]),
      { beat: s.cta, punch: 0, sway: 0.2 },
    ],
    shakes: [{ beat: s.drop, strength: 30, beats: 0.5 }],
  };
};
