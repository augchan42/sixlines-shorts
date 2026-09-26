import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// A searchlight panning slowly across a lesson's picture, once, like the one in the end card:
// a soft pale beam from below the frame that swings from one side to the other over the
// sequence. It replaces the beat punch (the user, 2026-09-26: a searchlight panning, not a
// dance floor). The frame itself keeps still.
export const Searchlight: React.FC<{ from?: number; to?: number; strength?: number }> = ({ from = -32, to = 32, strength = 0.2 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const angle = interpolate(frame, [0, durationInFrames], [from, to], { easing: Easing.inOut(Easing.sin), extrapolateRight: "clamp" });
  // Fades in and out, so the beam never cuts on or off.
  const fade = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden", mixBlendMode: "screen", opacity: fade }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: -300,
          width: 900,
          height: 3000,
          marginLeft: -450,
          transformOrigin: "50% 100%",
          transform: `rotate(${angle}deg)`,
          background: `linear-gradient(90deg, transparent 0%, rgba(215, 255, 225, ${strength}) 42%, rgba(235, 255, 240, ${strength * 1.4}) 50%, rgba(215, 255, 225, ${strength}) 58%, transparent 100%)`,
          clipPath: "polygon(38% 100%, 62% 100%, 100% 0%, 0% 0%)",
          filter: "blur(40px)",
        }}
      />
    </AbsoluteFill>
  );
};
