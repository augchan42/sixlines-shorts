import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { RGBSplit } from "../fx/Glitch";
import { fonts } from "../lib/fonts";
import { CodeRain } from "./CodeRain";

const green = "#6cff7a";

// Three lines of a trigram, top line first on screen.
const Lines: React.FC<{ lines: (0 | 1)[] }> = ({ lines }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
    {[...lines].reverse().map((yang, i) => (
      <div key={i} style={{ display: "flex", gap: 70, width: 620, height: 46 }}>
        {(yang ? [1] : [0, 1]).map((k) => (
          <div key={k} style={{ flex: 1, backgroundColor: green, boxShadow: `0 0 22px ${green}` }} />
        ))}
      </div>
    ))}
  </div>
);

const Label: React.FC<{ zh: string; name: string; opacity: number }> = ({ zh, name, opacity }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 30, opacity, margin: "34px 0" }}>
    <div style={{ fontFamily: fonts.serif, fontSize: 110, color: "#fff", textShadow: `0 0 18px ${green}` }}>{zh}</div>
    <div style={{ fontFamily: fonts.pixel, fontSize: 64, color: green, textShadow: `0 0 12px ${green}` }}>{name}</div>
  </div>
);

// The hexagram comes apart into its two trigrams, each named by its image: the upper
// ("EARTH") rises and the lower ("WATER") falls, over code rain.
export const Trigrams: React.FC<{
  lines: (0 | 1)[];
  trigrams: [{ zh: string; name: string }, { zh: string; name: string }];
}> = ({ lines, trigrams: [upper, lower] }) => {
  const frame = useCurrentFrame();
  const apart = interpolate(frame, [6, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const label = interpolate(frame, [14, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <CodeRain text="" showText={false} />
      <RGBSplit amount={frame < 3 || (frame > 6 && frame < 12) ? 14 : 3} seed="trigrams">
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 160 }}>
          <Label {...upper} opacity={label} />
          <Lines lines={lines.slice(3) as (0 | 1)[]} />
          <div style={{ height: 70 + apart * 170 }} />
          <Lines lines={lines.slice(0, 3) as (0 | 1)[]} />
          <Label {...lower} opacity={label} />
        </AbsoluteFill>
      </RGBSplit>
    </AbsoluteFill>
  );
};
