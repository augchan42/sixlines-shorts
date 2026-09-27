import { Audio, interpolate, staticFile, useVideoConfig } from "remotion";

// The short's music: starts `start` seconds into the file and fades out from `fadeFrom`
// (a frame) to the end, at `volume` (1 by default).
export const Soundtrack: React.FC<{ src: string | null; start: number; fadeFrom: number; volume?: number }> = ({
  src,
  start,
  fadeFrom,
  volume = 1,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (!src) return null;
  return (
    <Audio
      src={staticFile(src)}
      trimBefore={Math.round(start * fps)}
      volume={(frame) =>
        volume * interpolate(frame, [fadeFrom, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      }
    />
  );
};
