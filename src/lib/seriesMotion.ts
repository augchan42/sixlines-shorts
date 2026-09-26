import type { SeriesPlan } from "./seriesPlan";

// How the frame moves through a series short (src/fx/Camera.tsx). The camera keeps still
// while there is text to read (hook, meaning, question, a lesson's sentence) and moves on
// the accents: the drop's burst of shake, the beat punches over the showcase, and the cuts.
// A lesson's picture keeps still, with no punch or shake (the user found the punch distracting,
// 2026-09-26). Shake on whole sections is distracting and hard on people with motion
// sensitivity (docs/adr/ADR-SHORTS-001-camera-still-over-text.md).
// Where a lesson's sentence comes on: over the last 3 beats of a character, the last 5 of
// a moon, else halfway.
export const sentenceBeat = (s: SeriesPlan, lesson: { kind?: string; clip?: string }) =>
  lesson.kind === "character" ? s.cta - 3 : lesson.clip ? s.cta - 5 : s.showcase + (s.cta - s.showcase) / 2;

export const seriesMotion = (s: SeriesPlan, lesson?: { kind?: string; clip?: string }) => {
  const sentence = lesson ? sentenceBeat(s, lesson) : null;
  return {
    motion: [
      { beat: -10, punch: 0, sway: 0.15 },
      { beat: s.hexagram, punch: 0, sway: 0.3 },
      { beat: s.meaning, punch: 0, sway: 0.15 },
      { beat: s.question, punch: 0, sway: 0.1 },
      { beat: s.drop, punch: lesson ? 0 : 0.03, sway: lesson ? 0.1 : 0.3 },
      ...(sentence === null ? [] : [{ beat: sentence, punch: 0, sway: 0.1 }]),
      { beat: s.cta, punch: 0, sway: 0.2 },
    ],
    // A lesson has no shake at the drop either: its picture keeps still (the user, 2026-09-26).
    shakes: lesson ? [] : [{ beat: s.drop, strength: 30, beats: 0.5 }],
  };
};
