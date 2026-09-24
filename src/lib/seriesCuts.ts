import type { Cut, Motion, Shake } from "../fx/Camera";
import type { SeriesPlan } from "./seriesPlan";

// How a series short cuts, by the energy of its track
// (docs/research/2026-09-24-transitions.md, section 3): calm tracks dip slowly through
// black, steady ones punch on the text and wipe a line between screens, building ones stay
// soft until the question and then hit the drop hard, and the driving one whips throughout.
export type CutStyle = "calm" | "steady" | "building" | "driving";

export const CUT_STYLE: Record<string, CutStyle> = {
  kun: "calm", gen: "calm", qian: "steady", li: "steady", zhen: "building", kan: "building", xun: "building", dui: "driving",
};

export type SeriesCuts = {
  cuts: Cut[];
  motion: Motion[];
  shakes: Shake[];
  // Beats with a hard punch-in, a white flash, or an RGB-split burst.
  hits: number[];
  flashes: number[];
  glitches: number[];
};

export const seriesCuts = (style: CutStyle, s: SeriesPlan, screens: number): SeriesCuts => {
  const half = s.meaningLength / 2;
  const screenBeats = (s.cta - s.showcase) / screens;
  const changes = Array.from({ length: screens - 1 }, (_, i) => s.showcase + (i + 1) * screenBeats);
  const dip = (beat: number, beats = 0.75): Cut => ({ beat, kind: "dip", beats });
  const whip = (i: number): Cut["kind"] => (i % 2 ? "whip-right" : "whip-left");

  let cuts: Cut[];
  let motion: Motion[];
  let shakes: Shake[] = [];
  let hits: number[] = [];
  let flashes: number[] = [];
  let glitches: number[] = [];
  if (style === "calm") {
    cuts = [
      dip(s.hexagram), dip(s.meaning), dip(s.meaning + half), dip(s.question),
      ...changes.map((b) => dip(b)), dip(s.cta, 1), dip(s.credit),
    ];
    motion = [
      { beat: -10, punch: 0, sway: 0.3 },
      { beat: s.drop, punch: 0.02, sway: 0.4 },
      { beat: s.cta, punch: 0, sway: 0.2 },
    ];
  } else if (style === "steady") {
    cuts = [
      { beat: s.hexagram, kind: "zoom" },
      { beat: s.meaning, kind: "cut" }, { beat: s.meaning + half, kind: "cut" }, { beat: s.question, kind: "cut" },
      ...changes.map((beat): Cut => ({ beat, kind: "line", beats: 0.5 })),
      { beat: s.cta, kind: "zoom" }, { beat: s.credit, kind: "line", beats: 0.5 },
    ];
    motion = [
      { beat: -10, punch: 0, sway: 0.3 },
      { beat: s.meaning, punch: 0.03, sway: 0.3 },
      { beat: s.drop, punch: 0.04, sway: 0.4 },
      { beat: s.cta, punch: 0, sway: 0.2 },
    ];
    hits = [s.meaning, s.meaning + half, s.question];
    shakes = [{ beat: s.drop, strength: 15, beats: 1 }];
  } else {
    const building = style === "building";
    cuts = [
      { beat: s.hexagram, kind: "zoom" },
      building ? dip(s.meaning, 0.5) : { beat: s.meaning, kind: "whip-up" },
      building ? dip(s.meaning + half, 0.5) : { beat: s.meaning + half, kind: "whip-left" },
      { beat: s.question, kind: "whip-right" },
      ...changes.map((beat, i): Cut => ({ beat, kind: whip(i) })),
      { beat: s.cta, kind: "zoom" }, { beat: s.credit, kind: "whip-up" },
    ];
    motion = [
      { beat: -10, punch: 0, sway: 0.3 },
      { beat: s.meaning, punch: building ? 0.01 : 0.03, sway: 0.4 },
      { beat: s.question, punch: building ? 0.02 : 0, sway: 0.2 },
      { beat: s.drop, punch: 0.07, sway: 0.6 },
      { beat: s.cta, punch: 0, sway: 0.2 },
    ];
    shakes = [{ beat: s.drop, strength: 45, beats: 1 }];
    flashes = [s.drop];
    glitches = building ? [s.drop] : [s.drop, ...changes];
  }
  // The drop always zooms; after-drop timing puts the meaning on the same beat.
  cuts = [...cuts.filter((c) => c.beat !== s.drop), { beat: s.drop, kind: "zoom" as const }].sort((a, b) => a.beat - b.beat);
  return { cuts, motion, shakes, hits, flashes, glitches };
};
