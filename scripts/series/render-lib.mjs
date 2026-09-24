// Pure helpers for the series scripts (series-clips, series-screens, series).
import { seriesPlan } from "../../src/lib/seriesPlan.ts";

export const parseNumbers = (arg) => {
  if (arg === "all") return "all";
  const ns = String(arg ?? "").split(",").map(Number);
  if (!ns.length || ns.some((n) => !Number.isInteger(n) || n < 1 || n > 64)) {
    throw new Error(`hexagrams must be 1 to 64, a comma-separated list, or "all" (got ${arg})`);
  }
  return ns;
};

export const clipJobs = (propsList, exists) => {
  const seen = new Set();
  const jobs = [];
  for (const p of propsList) {
    if (seen.has(p.hexagramClip) || exists(p.hexagramClip)) continue;
    seen.add(p.hexagramClip);
    jobs.push({ clip: p.hexagramClip, lines: p.hexagram.lines.join(""), bpm: p.bpm, beats: seriesPlan(p.bpm, p.drop).hexagramBeats });
  }
  return jobs;
};
