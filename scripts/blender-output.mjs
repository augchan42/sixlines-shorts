// Moves a finished render to its clip's name only if it has every frame, so a short or
// half-written render can never be played by Remotion as the real clip.

import { mkdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";

export const keepIfComplete = ({ partial, out, frames, expected }) => {
  if (frames < expected) {
    rmSync(partial, { force: true });
    return false;
  }
  mkdirSync(path.dirname(out), { recursive: true });
  renameSync(partial, out);
  return true;
};
