// Prototype: hexagram 1 in the proposed ~30 s series format, on Qian's section of pick 01
// (music/sections.json), made to see and hear the structure before the series spec.
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Camera } from "../fx/Camera";
import { FxDefs, Grain } from "../fx/Glitch";
import { Soundtrack } from "../fx/Soundtrack";
import { hexagramClip } from "../lib/clips";
import { fonts } from "../lib/fonts";
import { beatFrame, GridContext, type Grid } from "../lib/timing";
import { CaptionScreen } from "../scenes/CaptionScreen";
import { CodeRain } from "../scenes/CodeRain";
import { EndCard } from "../scenes/EndCard";
import { Hexagram3D } from "../scenes/Hexagram3D";
import { Hook } from "../scenes/Hook";
import { qian } from "../specs/qian";

const plate = (key: string) => `assets/yilin/stipple-${key}.webp`;

export const spike1 = {
  bpm: 102,
  firstBeat: 0,
  music: "local/music/pick01-retrowave-synthwave-80s-90s-retro-pop-fu.mp3",
  musicStart: 37.671,
  hook: "A reading with no fine print?",
  meaning: ["Four words.\nNo conditions.", "It just says: go."],
  question: "Do you mean it?",
  screens: [
    { src: "assets/matrix-reading.png", caption: "READ THE STRUCTURE" },
    { src: "assets/matrix-yilin-1-1.png", caption: "THE BOOK OF CHANGES" },
    { src: "assets/matrix-records.png", caption: "SIXTY-FOUR RECORDS" },
    { src: "assets/matrix-ask.png", caption: "ASK · CAST · REFLECT" },
  ],
  cta: "Cast yours free · Six Lines",
};

// Beats: hook 0, hexagram 4, meaning 12 and 16, question 20, drop 24, screens every 5, CTA 44, end 51.
export const P = { hexagram: 4, meaning: 12, question: 20, drop: 24, cta: 44, end: 51 };
export const spike1Frames = (fps: number) => beatFrame({ fps, bpm: spike1.bpm, firstBeat: 0 }, P.end);

const Badge: React.FC = () => (
  <AbsoluteFill style={{ padding: "240px 70px 0", pointerEvents: "none" }}>
    <div style={{ fontFamily: fonts.pixel, fontSize: 44, color: "#6cff7a", textShadow: "0 0 12px #6cff7a" }}>
      1 / 64 · SIXTY-FOUR RECORDS
    </div>
  </AbsoluteFill>
);

export const Series1: React.FC = () => {
  const { fps } = useVideoConfig();
  const grid: Grid = { fps, bpm: spike1.bpm, firstBeat: spike1.firstBeat };
  const f = (b: number) => beatFrame(grid, b);
  const span = (a: number, b: number) => ({ from: f(a), durationInFrames: f(b) - f(a) });
  const rain = (text: string, key: string) => <CodeRain text={text} cuts={[{ frame: 0, src: plate(key) }]} />;
  return (
    <GridContext.Provider value={grid}>
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <FxDefs />
        <Soundtrack src={spike1.music} start={spike1.musicStart} fadeFrom={f(P.end - 2)} />
        <Camera
          cuts={[
            { beat: P.hexagram, kind: "zoom" },
            { beat: P.meaning, kind: "whip-up" },
            { beat: P.meaning + 4, kind: "whip-left" },
            { beat: P.question, kind: "whip-right" },
            { beat: P.drop, kind: "zoom" },
            ...[1, 2, 3].map((i) => ({ beat: P.drop + i * 5, kind: (i % 2 ? "whip-left" : "whip-right") as "whip-left" })),
            { beat: P.cta, kind: "zoom" },
          ]}
          motion={[
            { beat: -10, punch: 0, sway: 0.3 },
            { beat: P.meaning, punch: 0.03, sway: 0.4 },
            { beat: P.question, punch: 0, sway: 0.2 },
            { beat: P.drop, punch: 0.07, sway: 0.6 },
            { beat: P.cta, punch: 0, sway: 0.2 },
          ]}
          shakes={[{ beat: P.drop, strength: 45, beats: 1 }]}
        >
          <Sequence {...span(0, P.hexagram)}>
            <Hook text={spike1.hook} />
          </Sequence>
          <Sequence {...span(P.hexagram, P.meaning)}>
            <Hexagram3D hexagram={qian.hexagram} clip={hexagramClip(qian.hexagram.lines, spike1.bpm, P.meaning - P.hexagram)} />
          </Sequence>
          <Sequence {...span(P.meaning, P.meaning + 4)}>{rain(spike1.meaning[0], "1-40")}</Sequence>
          <Sequence {...span(P.meaning + 4, P.question)}>{rain(spike1.meaning[1], "1-24")}</Sequence>
          <Sequence {...span(P.question, P.drop)}>
            <CodeRain text={spike1.question} />
          </Sequence>
          {spike1.screens.map((s, i) => (
            <Sequence key={s.src} {...span(P.drop + i * 5, P.drop + i * 5 + 5)}>
              <CaptionScreen src={s.src} caption={s.caption} color={i % 2 ? "#ffb23f" : "#7dff8a"} seed={`cap-${i}`} />
            </Sequence>
          ))}
          <Sequence {...span(P.cta, P.end)}>
            <EndCard credit="~sixlines" cta={spike1.cta} icon={qian.icon} />
          </Sequence>
        </Camera>
        <Sequence from={0} durationInFrames={f(P.drop)}>
          <Badge />
        </Sequence>
        <Grain />
      </AbsoluteFill>
    </GridContext.Provider>
  );
};
