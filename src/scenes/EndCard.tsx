import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { glow } from "../fx/Glitch";
import { fonts } from "../lib/fonts";

// Creator credit, then the icon and call to action.
export const EndCard: React.FC<{ credit: string; cta: string; icon: string }> = ({ credit, cta, icon }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const whiteOut = interpolate(frame, [0, 6], [1, 0], { extrapolateRight: "clamp" });
  const creditIn = spring({ frame, fps, config: { damping: 10, stiffness: 160 } });
  const ctaIn = interpolate(frame, [12, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center", opacity: fadeOut }}>
      <div
        style={{
          fontFamily: fonts.credit,
          fontSize: 96,
          color: "#fff",
          transform: `rotate(-10deg) scale(${creditIn})`,
          textShadow: glow(),
        }}
      >
        {credit}
      </div>
      <div style={{ marginTop: 160, display: "flex", flexDirection: "column", alignItems: "center", opacity: ctaIn }}>
        <Img src={staticFile(icon)} style={{ width: 200 }} />
        <div style={{ marginTop: 36, fontFamily: fonts.serif, fontSize: 52, color: "#f4efe4" }}>{cta}</div>
      </div>
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: whiteOut }} />
    </AbsoluteFill>
  );
};
