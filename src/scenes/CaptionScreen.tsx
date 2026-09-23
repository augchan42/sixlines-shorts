import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { fringe, RGBSplit, Slices } from "../fx/Glitch";
import { fonts } from "../lib/fonts";

// A full-bleed app screen, dimmed, with a terminal caption typed over the top.
export const CaptionScreen: React.FC<{ src: string; caption: string; color: string; seed: string }> = ({
  src,
  caption,
  color,
  seed,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const typed = Math.ceil(interpolate(frame, [0, 8], [0, caption.length], { extrapolateRight: "clamp" }));
  return (
    <Slices amount={frame < 3 || frame > durationInFrames - 3 ? 140 : 0} seed={seed}>
      <RGBSplit amount={frame < 4 ? 14 : 3} seed={seed}>
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
          <Img
            src={staticFile(src)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 35%",
              filter: "brightness(0.6)",
              transform: `scale(${1.08 + (frame / durationInFrames) * 0.1})`,
            }}
          />
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 40%)" }} />
          <AbsoluteFill style={{ padding: "210px 90px 0" }}>
            <div style={{ fontFamily: fonts.pixel, fontSize: 92, lineHeight: 1.15, color, textShadow: fringe(3) }}>
              {caption.slice(0, typed)}
            </div>
            <div style={{ width: 200, height: 12, marginTop: 28, backgroundColor: color, boxShadow: `0 0 18px ${color}` }} />
          </AbsoluteFill>
        </AbsoluteFill>
      </RGBSplit>
    </Slices>
  );
};
