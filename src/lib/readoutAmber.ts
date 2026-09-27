// Which lines of a readout are amber at a frame. Amber is the line to look at, so it follows the
// text on screen (Codex's review, 2026-09-27): the master line while WANG BI names it, then the
// lines the finding is about (`findingMark`, every marked line when it is not given). A readout
// with no master line keeps every marked line amber from the first of the two.
export type AmberReadout = { mark: number[]; master?: { line?: number }; findingMark?: number[] };

export const amberLines = (r: AmberReadout, frame: number, { masterAt, findingAt }: { masterAt: number; findingAt: number }): number[] => {
  const line = r.master?.line;
  if (line === undefined) return frame >= (r.master ? masterAt : findingAt) ? r.mark : [];
  if (frame >= findingAt) return r.findingMark ?? r.mark;
  return frame >= masterAt ? [line] : [];
};

// A staged readout runs on seconds, so the master holds long enough to read at any tempo. The
// user, on 22 (2026-09-27): "line 5 turns amber very quickly, and way too quickly for anyone to
// learn master of adornment." Seconds from the start of the lesson: the plot, the answering
// links, the trigrams, WANG BI and the master line alone for 3.2 s, the finding, the answer.
export const STAGED = { plotFrom: 0.4, plotTo: 2.4, links: 2.5, trigrams: 3.0, master: 3.8, finding: 7.0, answer: 8.8 };
// The sentence typed after the answer, then held for about 2.5 s.
export const STAGED_SECONDS = 12.8;
// Whole beats for a staged lesson at this tempo, never fewer than the held 16.
export const stagedBeats = (bpm: number) => Math.max(16, Math.ceil((STAGED_SECONDS * bpm) / 60));
