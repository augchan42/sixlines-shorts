import { AbsoluteFill, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { fringe, glow, RGBSplit, Slices } from "../fx/Glitch";
import { ImageCanvas } from "../fx/ImageCanvas";
import { fonts } from "../lib/fonts";
import { framesPerBeat, useGrid } from "../lib/timing";
import type { ShortProps } from "../schema";

// Ten beats of fast cuts: the hexagram builds, the pattern line over ink art,
// four app screens, then the art pixel-dissolves into a white flash.
export const Montage: React.FC<{
  hexagram: ShortProps["hexagram"];
  pattern: string;
  art: string[];
  screens: string[];
}> = ({ hexagram, pattern, art, screens }) => {
  const beat = framesPerBeat(useGrid());
  const at = (b: number) => Math.round(b * beat);
  const len = (from: number, to: number) => at(to) - at(from);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={at(0)} durationInFrames={len(0, 2)}>
        <Hexagram hexagram={hexagram} />
      </Sequence>
      <Sequence from={at(2)} durationInFrames={len(2, 4)}>
        <PatternLine text={pattern} art={art[1 % art.length]} />
      </Sequence>
      {screens.slice(0, 4).map((screen, i) => (
        <Sequence key={screen} from={at(4 + i)} durationInFrames={len(4 + i, 5 + i)}>
          <Screen src={screen} art={art[(i + 2) % art.length]} flip={i % 2 === 1} seed={`screen-${i}`} />
        </Sequence>
      ))}
      <Sequence from={at(8)} durationInFrames={len(8, 10)}>
        <Dissolve art={art[art.length - 1]} />
      </Sequence>
    </AbsoluteFill>
  );
};

const Hexagram: React.FC<{ hexagram: ShortProps["hexagram"] }> = ({ hexagram }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const perLine = (durationInFrames * 0.6) / 6;
  const green = "#6cff7a";
  return (
    <RGBSplit amount={frame < 3 ? 16 : 4} seed="hex">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 26, paddingBottom: 240 }}>
        {/* Top line first on screen; lines build from the bottom up, as when casting. */}
        {[5, 4, 3, 2, 1, 0].map((i) => {
          const w = interpolate(frame - i * perLine, [0, 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ display: "flex", gap: 60, width: 620 * w, height: 58 }}>
              {(hexagram.lines[i] ? [1] : [0, 1]).map((k) => (
                <div key={k} style={{ flex: 1, backgroundColor: green, boxShadow: `0 0 22px ${green}` }} />
              ))}
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 330 }}>
        <div style={{ fontFamily: fonts.serif, fontSize: 150, color: "#fff", textShadow: glow() }}>{hexagram.zh}</div>
        <div style={{ fontFamily: fonts.serif, fontSize: 58, color: green, marginTop: 10 }}>
          {hexagram.number} · {hexagram.pinyin} · {hexagram.name}
        </div>
      </AbsoluteFill>
    </RGBSplit>
  );
};

const PatternLine: React.FC<{ text: string; art: string }> = ({ text, art }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const words = text.split(" ");
  const half = Math.ceil(words.length / 2);
  return (
    <Slices amount={frame < 3 ? 120 : 0} seed="pattern">
      <AbsoluteFill>
        <ImageCanvas src={art} width={width} height={height} mode={{ kind: "plain" }} zoom={1.15 + (frame / durationInFrames) * 0.2} panY={0.4} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 45%)" }} />
        <AbsoluteFill style={{ padding: "220px 80px 0" }}>
          {[words.slice(0, half), words.slice(half)].map((line, i) => (
            <div key={i} style={{ fontFamily: fonts.pixel, fontSize: 104, lineHeight: 1.12, color: "#fff", textShadow: fringe(4) }}>
              {line.join(" ")}
            </div>
          ))}
        </AbsoluteFill>
      </AbsoluteFill>
    </Slices>
  );
};

const Screen: React.FC<{ src: string; art: string; flip: boolean; seed: string }> = ({ src, art, flip, seed }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 200 } });
  const dir = flip ? -1 : 1;
  return (
    <RGBSplit amount={frame < 3 ? 18 : 3} seed={seed}>
      <AbsoluteFill style={{ opacity: 0.45 }}>
        <ImageCanvas src={art} width={width} height={height} mode={{ kind: "halftone", cell: 16, tint: "#7dff8a" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 1400 }}>
        <Img
          src={staticFile(src)}
          style={{
            width: 720,
            borderRadius: 64,
            border: "10px solid #111",
            boxShadow: "0 40px 120px rgba(0,0,0,0.8)",
            transform: `translateX(${interpolate(enter, [0, 1], [700 * dir, 0])}px) rotateY(${-16 * dir}deg) rotateZ(${3 * dir}deg)`,
          }}
        />
      </AbsoluteFill>
    </RGBSplit>
  );
};

const Dissolve: React.FC<{ art: string }> = ({ art }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const block = Math.max(2, Math.round(interpolate(frame, [0, durationInFrames * 0.7], [110, 2], { extrapolateRight: "clamp" })));
  const flash = interpolate(frame, [durationInFrames - 6, durationInFrames], [0, 1], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill>
      <ImageCanvas src={art} width={width} height={height} mode={{ kind: "pixel", block }} zoom={1.3} />
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};
