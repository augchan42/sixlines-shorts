// Names and lengths of the clips rendered by blender/hexagram.py and blender/endcard.py. Shared by the specs and
// scripts/blender.mjs, so it has no imports.

export const CLIP_FPS = 30;

// Frames rendered for a section of `beats` beats. Section lengths come from rounding
// absolute beat times, so this is always at least as many as the section takes.
export const clipFrames = (beats: number, bpm: number) => Math.ceil((beats * 60 * CLIP_FPS) / bpm) + 1;

// public/-relative path of a hexagram clip. Only the lines (bottom first), tempo and
// length change the clip, so hexagrams that share them share a file.
export const hexagramClip = (lines: readonly number[], bpm: number, beats: number, preview = false) =>
  `assets/3d/hexagram-${lines.join("")}-${bpm}bpm-${beats}b${preview ? "-preview" : ""}.mp4`;

// How the end card turns the hexagram into six yang lines (blender/endcard.py --mode).
export type EndcardMode = "join" | "flip" | "snap" | "fill";

// public/-relative path of an end card: the hexagram it starts from, its tempo, length and treatment.
export const endcardClip = (lines: readonly number[], bpm: number, beats: number, mode: EndcardMode) =>
  `assets/3d/endcard-${mode}-${lines.join("")}-${bpm}bpm-${beats}b.mp4`;
