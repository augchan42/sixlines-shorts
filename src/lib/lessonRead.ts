// Seconds to hold the answer lines typed since the last cut before the lesson cuts to a full
// readout: reading time at 3.7 words a second, never under 1.5 s. Without it, "READ THE AMBER
// FINDING." was gone as soon as it was typed (the user, 2026-09-27).
export const readBeforeCut = (lines: string[]): number => Math.max(1.5, lines.join(" ").split(/\s+/).filter(Boolean).length / 3.7);
