// Names and lengths of the clips rendered by blender/hexagram.py and blender/endcard.py. Shared by the specs and
// scripts/blender.mjs, so it has no imports.

export const CLIP_FPS = 30;

// A tempo-independent clip is rendered once at the fastest tempo the series allows (the user:
// nothing above 120 bpm) and at 60 fps, and played at track bpm / REF_BPM (0.5-1.0): a 30 fps
// output then never repeats a source frame. So a music change is a Remotion render, not a
// Blender one (docs/research/2026-09-27-recompose.md, plan B).
export const REF_BPM = 120;
export const REF_FPS = 60;

// Frames rendered for a section of `beats` beats. Section lengths come from rounding
// absolute beat times, so this is always at least as many as the section takes.
export const clipFrames = (beats: number, bpm: number, fps = CLIP_FPS) => Math.ceil((beats * 60 * fps) / bpm) + 1;

// public/-relative path of a hexagram clip. Only the lines (bottom first), tempo and
// length change the clip, so hexagrams that share them share a file.
export const hexagramClip = (lines: readonly number[], bpm: number, beats: number, preview = false) =>
  `assets/3d/hexagram-${lines.join("")}-${bpm}bpm-${beats}b${preview ? "-preview" : ""}.mp4`;

// How the end card turns the hexagram into six yang lines (blender/endcard.py --mode). The
// script's fourth treatment, fill, is left out: the user found it underwhelming (2026-09-24).
export type EndcardMode = "join" | "flip" | "snap";

// public/-relative path of an end card: the hexagram it starts from, its tempo, length and treatment.
export const endcardClip = (lines: readonly number[], bpm: number, beats: number, mode: EndcardMode) =>
  `assets/3d/endcard-${mode}-${lines.join("")}-${bpm}bpm-${beats}b.mp4`;

// The tempo-independent end card (scripts/endcard.mjs --ref): REF_BPM at REF_FPS, any track.
export const endcardRefClip = (lines: readonly number[], beats: number, mode: EndcardMode) =>
  `assets/3d/endcard-${mode}-${lines.join("")}-${beats}b-ref.mp4`;

// A short hash of a clip's labels or settings, so clips that differ never share a name.
const hash = (text: string) => {
  let h = 5381;
  for (const ch of text) h = ((h * 33) ^ ch.codePointAt(0)!) >>> 0;
  return h.toString(36);
};
const labelHash = (labels: readonly string[]) => hash(labels.join("|"));

// public/-relative path of a moon (blender/moon.py): the hexagram it stands in front of, its
// tempo and length, and the labels its lines light up with, if any.
export const moonClip = (lines: readonly number[], bpm: number, beats: number, labels?: readonly string[]) =>
  `assets/3d/moon-${lines.join("")}-${bpm}bpm-${beats}b${labels ? `-labels-${labelHash(labels)}` : ""}.mp4`;

// public/-relative path of a character lesson (blender/character.py): the hexagram, its
// tempo and length, and a hash of its settings in series/characters.json.
export const characterClip = (number: number, bpm: number, beats: number, args: Record<string, unknown>) =>
  `assets/3d/character-${number}-${bpm}bpm-${beats}b-${hash(JSON.stringify(args))}.mp4`;

// public/-relative path of a lesson's Blender scene (blender/glyphs.py for a Judgment,
// blender/trigram.py for the trigrams' picture): the hexagram, script, tempo, length and a
// hash of its settings in the lesson's copy.
export const sceneClip = (number: number, script: string, bpm: number, beats: number, args: Record<string, unknown>) =>
  `assets/3d/${script}-${number}-${bpm}bpm-${beats}b-${hash(JSON.stringify(args))}.mp4`;
