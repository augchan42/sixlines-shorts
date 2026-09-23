import { AbsoluteFill, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { fringe, glow, RGBSplit, Slices } from "../fx/Glitch";
import { ImageCanvas } from "../fx/ImageCanvas";
import { fonts } from "../lib/fonts";
import { framesPerBeat, useGrid } from "../lib/timing";
import type { ShortProps } from "../schema";

// Where each part of the montage starts, in beats from its start.
export const montageBeats = (props: Pick<ShortProps, "art">) => {
  const run = 2;
  const screens = run + Math.ceil(props.art.run.length / 2);
  const dissolve = screens + 4;
  return { run, screens, dissolve, end: dissolve + 2 };
};

// Fast cuts: the hexagram builds, the pattern line over a run of plates changing every
// half-beat, four app screens, then the finale plate pixel-dissolves into a white flash.
export const Montage: React.FC<{
  hexagram: ShortProps["hexagram"];
  pattern: string;
  art: ShortProps["art"];
  screens: string[];
}> = ({ hexagram, pattern, art, screens }) => {
  const beat = framesPerBeat(useGrid());
  const at = (b: number) => Math.round(b * beat);
  const len = (from: number, to: number) => at(to) - at(from);
  const m = montageBeats({ art });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={at(0)} durationInFrames={len(0, m.run)}>
        <Hexagram hexagram={hexagram} />
      </Sequence>
      <Sequence from={at(m.run)} durationInFrames={len(m.run, m.screens)}>
        <PatternLine text={pattern} plates={art.run} />
      </Sequence>
      {screens.slice(0, 4).map((screen, i) => (
        <Sequence key={screen} from={at(m.screens + i)} durationInFrames={len(m.screens + i, m.screens + i + 1)}>
          <Screen src={screen} art={art.screens[i % art.screens.length]} flip={i % 2 === 1} seed={`screen-${i}`} />
        </Sequence>
      ))}
      <Sequence from={at(m.dissolve)} durationInFrames={len(m.dissolve, m.end)}>
        <Dissolve art={art.finale} />
      </Sequence>
    </AbsoluteFill>
  );
};

// Proportions follow the site's OG image (sixlines-site src/app/api/og/route.tsx):
// lines within a trigram sit 0.6 line-heights apart, the two trigrams 1.8.
const LINE = 50;
const LINE_GAP = LINE * 0.6;
const TRIGRAM_GAP = LINE * 1.8;

export const Hexagram: React.FC<{ hexagram: ShortProps["hexagram"] }> = ({ hexagram }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const perLine = (durationInFrames * 0.6) / 6;
  const green = "#6cff7a";
  return (
    <RGBSplit amount={frame < 3 ? 16 : 4} seed="hex">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 240 }}>
        {/* Top line first on screen; lines build from the bottom up, as when casting. */}
        {[5, 4, 3, 2, 1, 0].map((i) => {
          const w = interpolate(frame - i * perLine, [0, 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 70,
                width: 620 * w,
                height: LINE,
                marginBottom: i === 3 ? TRIGRAM_GAP : i === 0 ? 0 : LINE_GAP,
              }}
            >
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

// The pattern line holds while the plates behind it change every half-beat.
export const PatternLine: React.FC<{ text: string; plates: string[] }> = ({ text, plates }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const half = framesPerBeat(useGrid()) / 2;
  const index = Math.min(Math.floor(frame / half), plates.length - 1);
  const sinceSwap = frame - Math.round(index * half);
  const words = text.split(" ");
  const halfWords = Math.ceil(words.length / 2);
  return (
    <Slices amount={sinceSwap < 2 ? 120 : 0} seed={`pattern-${index}`}>
      <AbsoluteFill>
        <ImageCanvas
          key={plates[index]}
          src={plates[index]}
          width={width}
          height={height}
          mode={{ kind: "plain" }}
          zoom={1.15 + (frame / durationInFrames) * 0.2}
          panY={0.4}
        />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 45%)" }} />
        <AbsoluteFill style={{ padding: "220px 80px 0" }}>
          {[words.slice(0, halfWords), words.slice(halfWords)].map((line, i) => (
            <div key={i} style={{ fontFamily: fonts.pixel, fontSize: 132, lineHeight: 1.12, color: "#fff", textShadow: fringe(4) }}>
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
