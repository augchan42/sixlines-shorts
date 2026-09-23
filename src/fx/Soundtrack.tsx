import { Audio, interpolate, staticFile, useVideoConfig } from "remotion";

// The short's music: starts `start` seconds into the file and fades out from `fadeFrom`
// (a frame) to the end.
export const Soundtrack: React.FC<{ src: string | null; start: number; fadeFrom: number }> = ({
  src,
  start,
  fadeFrom,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (!src) return null;
  return (
    <Audio
      src={staticFile(src)}
      trimBefore={Math.round(start * fps)}
      volume={(frame) =>
        interpolate(frame, [fadeFrom, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      }
    />
  );
};
