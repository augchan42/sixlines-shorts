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
