import type { SeriesProps } from "../schema";

// Per-hexagram changes to the props seriesProps builds from series/hexagrams.json,
// e.g. a different music section or screen for one hexagram.
export const overrides: Record<number, Partial<SeriesProps>> = {};
