import { createContext, useContext } from "react";
import { random } from "remotion";

export type Grid = {
  fps: number;
  bpm: number;
  firstBeat: number;
};

// Absolute frame of a beat. Beat 0 is the first beat of the music.
export const beatFrame = (grid: Grid, beat: number) =>
  Math.round((grid.firstBeat + (beat * 60) / grid.bpm) * grid.fps);

export const framesPerBeat = (grid: Grid) => (60 / grid.bpm) * grid.fps;

export const GridContext = createContext<Grid | null>(null);

export const useGrid = () => {
  const grid = useContext(GridContext);
  if (!grid) throw new Error("useGrid must be used inside <GridContext.Provider>");
  return grid;
};

// Deterministic noise in [-1, 1]. `step` holds a value for that many frames so jitter
// reads as glitchy steps rather than smooth shimmer.
export const jitter = (seed: string, frame: number, step = 2) =>
  random(`${seed}-${Math.floor(frame / step)}`) * 2 - 1;
