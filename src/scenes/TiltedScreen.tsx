import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { RGBSplit, Slices } from "../fx/Glitch";

// A full-bleed app screen, tilted and drifting, that glitches in.
export const TiltedScreen: React.FC<{ src: string; flip: boolean; seed: string }> = ({ src, flip, seed }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const dir = flip ? -1 : 1;
  const t = frame / durationInFrames;
  return (
    <Slices amount={frame < 3 ? 130 : 0} seed={seed}>
      <RGBSplit amount={frame < 4 ? 16 : 4} seed={seed}>
        <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
          <Img
            src={staticFile(src)}
            style={{
              width: 1180,
              transform: `translateY(${interpolate(t, [0, 1], [120, -160])}px) rotate(${dir * 7}deg) scale(${1.12 + t * 0.12})`,
            }}
          />
        </AbsoluteFill>
      </RGBSplit>
    </Slices>
  );
};
