import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts } from "../lib/fonts";

const CREAM = "#f4e9d4";

// Her crown: an outline with a dot on each of its three points, drawn on as the name lands.
const Crown: React.FC<{ progress: number }> = ({ progress }) => {
  const outline = "M 12 92 L 8 38 L 38 62 L 60 22 L 82 62 L 112 38 L 108 92 Z";
  const length = 420;
  const dot = (cx: number, cy: number, at: number) => (
    <circle cx={cx} cy={cy} r={7} fill="none" stroke={CREAM} strokeWidth={4} opacity={interpolate(progress, [at, at + 0.15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
  );
  return (
    <svg viewBox="-4 0 128 100" width={210} style={{ overflow: "visible", filter: `drop-shadow(0 0 6px ${CREAM})` }}>
      <path d={outline} fill="none" stroke={CREAM} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={length} strokeDashoffset={length * (1 - progress)} />
      {dot(8, 29, 0.55)}
      {dot(60, 13, 0.7)}
      {dot(112, 29, 0.85)}
    </svg>
  );
};

// Credit to the creator of the original edit: "ORIGINAL EDIT BY", then her signature, the
// crown and "~DISNEYFAN" tilted up to the right, as at the end of her own shorts.
export const Credit: React.FC<{ name: string }> = ({ name }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const by = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const land = spring({ frame: frame - 2, fps, config: { damping: 11, stiffness: 170 } });
  const crown = interpolate(frame, [6, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center", opacity: fadeOut }}>
      <div style={{ fontFamily: fonts.serif, fontSize: 44, letterSpacing: "0.24em", color: CREAM, opacity: by, marginBottom: 150 }}>
        ORIGINAL EDIT BY
      </div>
      <div style={{ position: "relative", transform: `rotate(-12deg) scale(${land})` }}>
        <div style={{ position: "absolute", left: -50, top: -185, transform: "rotate(-26deg)" }}>
          <Crown progress={crown} />
        </div>
        <div
          style={{
            fontFamily: fonts.signature,
            fontWeight: 900,
            fontSize: 104,
            color: "#fff",
            textShadow: "0 0 6px #fff, 0 0 22px rgba(255,255,255,0.75), 0 0 52px rgba(255,255,255,0.45)",
          }}
        >
          {name}
        </div>
      </div>
    </AbsoluteFill>
  );
};
