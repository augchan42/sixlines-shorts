// Prototype: the series template driven by seriesPlan, for checking the three timing modes
// (spec: "Structure of a short") on real hexagrams before the template is built.
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Camera, type Cut } from "../fx/Camera";
import { FxDefs, Grain } from "../fx/Glitch";
import { Soundtrack } from "../fx/Soundtrack";
import { hexagramClip } from "../lib/clips";
import { fonts } from "../lib/fonts";
import { beatFrame, GridContext, type Grid } from "../lib/timing";
import type { ShortProps } from "../schema";
import { CaptionScreen } from "../scenes/CaptionScreen";
import { CodeRain } from "../scenes/CodeRain";
import { EndCard } from "../scenes/EndCard";
import { Hexagram3D } from "../scenes/Hexagram3D";
import { Hook } from "../scenes/Hook";
import { seriesPlan } from "./seriesPlan";

export type ProtoProps = {
  hexagram: ShortProps["hexagram"];
  bpm: number;
  music: string;
  musicStart: number;
  drop: number;
  hook: string;
  meaning: [string, string];
  question: string;
  plates: [string, string];
  screens: { src: string; caption: string }[];
};

const plate = (key: string) => `assets/yilin/stipple-${key}.webp`;

export const protoFrames = (p: ProtoProps, fps: number) => beatFrame({ fps, bpm: p.bpm, firstBeat: 0 }, seriesPlan(p.bpm, p.drop).end);

export const protoClip = (p: ProtoProps) => {
  const s = seriesPlan(p.bpm, p.drop);
  return hexagramClip(p.hexagram.lines, p.bpm, Math.min(s.meaning, s.drop) - s.hexagram);
};

const Badge: React.FC<{ n: number }> = ({ n }) => (
  <AbsoluteFill style={{ padding: "240px 70px 0", pointerEvents: "none" }}>
    <div style={{ fontFamily: fonts.pixel, fontSize: 44, color: "#6cff7a", textShadow: "0 0 12px #6cff7a" }}>
      {n} / 64 · SIXTY-FOUR RECORDS
    </div>
  </AbsoluteFill>
);

export const SeriesProto: React.FC<ProtoProps> = (props) => {
  const { fps } = useVideoConfig();
  const grid: Grid = { fps, bpm: props.bpm, firstBeat: 0 };
  const s = seriesPlan(props.bpm, props.drop);
  const f = (b: number) => beatFrame(grid, b);
  const span = (a: number, b: number) => ({ from: f(a), durationInFrames: f(b) - f(a) });
  const half = s.meaningLength / 2;
  const screenBeats = (s.cta - s.showcase) / props.screens.length;
  const cuts: Cut[] = [
    { beat: s.hexagram, kind: "zoom" },
    { beat: s.meaning, kind: "whip-up" },
    { beat: s.meaning + half, kind: "whip-left" },
    { beat: s.question, kind: "whip-right" },
    { beat: s.drop, kind: "zoom" },
    ...props.screens.slice(1).map((_, i) => ({ beat: s.showcase + (i + 1) * screenBeats, kind: (i % 2 ? "whip-right" : "whip-left") as Cut["kind"] })),
    { beat: s.cta, kind: "zoom" },
  ];
  return (
    <GridContext.Provider value={grid}>
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <FxDefs />
        <Soundtrack src={props.music} start={props.musicStart} fadeFrom={f(s.end - 2)} />
        <Camera
          cuts={cuts}
          motion={[
            { beat: -10, punch: 0, sway: 0.3 },
            { beat: s.meaning, punch: 0.03, sway: 0.4 },
            { beat: s.question, punch: 0, sway: 0.2 },
            { beat: s.drop, punch: 0.07, sway: 0.6 },
            { beat: s.cta, punch: 0, sway: 0.2 },
          ]}
          shakes={[{ beat: s.drop, strength: 45, beats: 1 }]}
        >
          <Sequence {...span(0, s.hexagram)}>
            <Hook text={props.hook} />
          </Sequence>
          <Sequence {...span(s.hexagram, Math.min(s.meaning, s.drop))}>
            <Hexagram3D hexagram={props.hexagram} clip={protoClip(props)} />
          </Sequence>
          {props.meaning.map((text, i) => (
            <Sequence key={text} {...span(s.meaning + i * half, s.meaning + (i + 1) * half)}>
              <CodeRain text={text} cuts={[{ frame: 0, src: plate(props.plates[i]) }]} />
            </Sequence>
          ))}
          <Sequence {...span(s.question, s.question + s.questionLength)}>
            <CodeRain text={props.question} />
          </Sequence>
          {props.screens.map((sc, i) => (
            <Sequence key={sc.src} {...span(s.showcase + i * screenBeats, s.showcase + (i + 1) * screenBeats)}>
              <CaptionScreen src={sc.src} caption={sc.caption} color={i % 2 ? "#ffb23f" : "#7dff8a"} seed={`cap-${i}`} />
            </Sequence>
          ))}
          <Sequence {...span(s.cta, s.end)}>
            <EndCard credit="~sixlines" cta="Explore the I-Ching for free · Six Lines" url="sixlines.day" icon="assets/icon.png" />
          </Sequence>
        </Camera>
        <Sequence from={0} durationInFrames={f(Math.min(s.drop, s.showcase))}>
          <Badge n={props.hexagram.number} />
        </Sequence>
        <Grain />
      </AbsoluteFill>
    </GridContext.Provider>
  );
};
