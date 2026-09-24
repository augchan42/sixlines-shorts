import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// The Blender end card (blender/endcard.py): the hexagram turns into six yang lines under
// SIX LINES, with the tagline and site. It fades out over its last few frames.
export const EndCard3D: React.FC<{ clip: string }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeOut }}>
      <OffthreadVideo src={staticFile(clip)} muted style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};
