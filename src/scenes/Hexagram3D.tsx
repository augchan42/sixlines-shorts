import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { RGBSplit } from "../fx/Glitch";
import { framesPerBeat, useGrid } from "../lib/timing";
import type { ShortProps } from "../schema";
import { HexagramTitle } from "./Montage";

// The Blender hexagram build (blender/hexagram.py). The names fade in as the last line lands.
export const Hexagram3D: React.FC<{ hexagram: ShortProps["hexagram"]; clip: string }> = ({ hexagram, clip }) => {
  const frame = useCurrentFrame();
  const beat = framesPerBeat(useGrid());
  const opacity = interpolate(frame, [beat * 2.5, beat * 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <RGBSplit amount={frame < 3 ? 16 : 4} seed="hex">
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <OffthreadVideo src={staticFile(clip)} muted style={{ width: "100%", height: "100%" }} />
        <AbsoluteFill style={{ opacity }}>
          <HexagramTitle hexagram={hexagram} />
        </AbsoluteFill>
      </AbsoluteFill>
    </RGBSplit>
  );
};
