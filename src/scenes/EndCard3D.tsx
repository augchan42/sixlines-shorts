import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

// The Blender end card (blender/endcard.py): the hexagram turns into six yang lines under
// SIX LINES, with the tagline and site. The credit whips in after it. Also plays lesson clips;
// `drop` moves the clip down (px) to clear room above it for text.
export const EndCard3D: React.FC<{ clip: string; drop?: number }> = ({ clip, drop = 0 }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <OffthreadVideo src={staticFile(clip)} muted style={{ width: "100%", height: "100%", transform: `translateY(${drop}px)` }} />
  </AbsoluteFill>
);
