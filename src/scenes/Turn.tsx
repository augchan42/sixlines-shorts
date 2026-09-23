import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { fringe, Slices } from "../fx/Glitch";
import { fonts } from "../lib/fonts";
import { framesPerBeat, useGrid } from "../lib/timing";

// "BUT THIS…" glitches in, then the app icon rises from the bottom edge.
export const Turn: React.FC<{ text: string; icon: string }> = ({ text, icon }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const beat = framesPerBeat(useGrid());
  const riseAt = Math.round(beat * 1.5);
  const rise = spring({ frame: frame - riseAt, fps, config: { damping: 13, stiffness: 120 } });
  const grow = interpolate(frame, [durationInFrames - beat, durationInFrames], [1, 1.9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textIn = frame < 5 || (frame > beat && frame < beat + 3);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Slices amount={textIn ? 120 : 0} seed="turn-text">
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
          <div style={{ fontFamily: fonts.punch, fontSize: 150, color: "#e8eefc", letterSpacing: 3, textShadow: fringe(5) }}>
            {text}
          </div>
        </AbsoluteFill>
      </Slices>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Img
          src={staticFile(icon)}
          style={{
            width: 360,
            transform: `translateY(${interpolate(rise, [0, 1], [1100, 180])}px) scale(${grow})`,
            filter: `blur(${interpolate(rise, [0, 0.6], [14, 0], { extrapolateRight: "clamp" })}px) drop-shadow(0 0 50px rgba(255,255,255,0.25))`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
