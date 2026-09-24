import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

// The Blender end card (blender/endcard.py): the hexagram turns into six yang lines under
// SIX LINES, with the tagline and site. The credit whips in after it.
export const EndCard3D: React.FC<{ clip: string }> = ({ clip }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <OffthreadVideo src={staticFile(clip)} muted style={{ width: "100%", height: "100%" }} />
  </AbsoluteFill>
);
