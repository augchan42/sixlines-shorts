import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { RGBSplit, Slices } from "../fx/Glitch";
import { fonts } from "../lib/fonts";

const green = "#6cff7a";

// A painting full-frame: it slams in on the cut, then pans across its width, with its
// credit ("RENOIR · 1881") low in the frame, above Instagram's bottom 420 px.
export const Painting: React.FC<{ src: string; credit: string }> = ({ src, credit }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  // How far across the pan is; a translate in % is of the image's own width.
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });
  const punch = 1 + 0.18 * Math.exp(-frame / 4);
  const shown = interpolate(frame, [8, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Slices amount={frame < 2 ? 160 : 0} seed="painting">
      <RGBSplit amount={frame < 3 ? 24 : 2} seed="painting">
        <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
          <Img
            src={staticFile(src)}
            style={{
              position: "absolute",
              height,
              width: "auto",
              maxWidth: "none",
              left: 0,
              top: 0,
              transform: `translateX(calc(${-p * 100}% + ${p * width}px)) scale(${punch})`,
            }}
          />
          <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 35%)" }} />
          <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 460, opacity: shown }}>
            <div style={{ fontFamily: fonts.pixel, fontSize: 64, color: green, textShadow: `0 0 12px ${green}`, letterSpacing: 2 }}>{credit}</div>
          </AbsoluteFill>
        </AbsoluteFill>
      </RGBSplit>
    </Slices>
  );
};
