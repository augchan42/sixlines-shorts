import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fringe, glow, RGBSplit } from "../fx/Glitch";
import { fonts } from "../lib/fonts";
import { jitter } from "../lib/timing";

// "Best app?" typed on with a glow, flickering between typewriter and condensed caps.
export const Hook: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const typed = Math.ceil(interpolate(frame, [0, 10], [0, text.length], { extrapolateRight: "clamp" }));
  const caps = frame > durationInFrames * 0.45 && jitter("hook-caps", frame, 3) > -0.1;
  const flicker = jitter("hook-flicker", frame, 1) > 0.85 ? 0.55 : 1;
  const split = frame > durationInFrames - 6 ? 14 : 0;

  return (
    <RGBSplit amount={split} seed="hook">
      <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontFamily: caps ? fonts.punch : fonts.typewriter,
            fontSize: caps ? 150 : 132,
            letterSpacing: caps ? 4 : 0,
            color: "#fff",
            opacity: flicker,
            textShadow: caps ? fringe(5) : glow(),
            // Wraps a long hook onto a second line instead of running off the frame.
            maxWidth: 940,
            textAlign: "center",
            lineHeight: 1.1,
            whiteSpace: "pre-wrap",
          }}
        >
          {(caps ? text.toUpperCase() : text).slice(0, typed)}
        </div>
      </AbsoluteFill>
    </RGBSplit>
  );
};
