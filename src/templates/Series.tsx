import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Camera } from "../fx/Camera";
import { FxDefs, Grain } from "../fx/Glitch";
import { Soundtrack } from "../fx/Soundtrack";
import { fonts } from "../lib/fonts";
import { seriesCuts } from "../lib/seriesCuts";
import { seriesPlan } from "../lib/seriesPlan";
import { beatFrame, GridContext, type Grid } from "../lib/timing";
import type { SeriesProps } from "../schema";
import { CaptionScreen } from "../scenes/CaptionScreen";
import { CodeRain } from "../scenes/CodeRain";
import { Credit } from "../scenes/Credit";
import { EndCard3D } from "../scenes/EndCard3D";
import { Hexagram3D } from "../scenes/Hexagram3D";
import { Hook } from "../scenes/Hook";

export const seriesFrames = (p: Pick<SeriesProps, "bpm" | "firstBeat" | "drop">, fps: number) =>
  beatFrame({ fps, bpm: p.bpm, firstBeat: p.firstBeat }, seriesPlan(p.bpm, p.drop).end);

const Badge: React.FC<{ n: number }> = ({ n }) => (
  <AbsoluteFill style={{ padding: "240px 70px 0", pointerEvents: "none" }}>
    <div style={{ fontFamily: fonts.pixel, fontSize: 44, color: "#6cff7a", textShadow: "0 0 12px #6cff7a" }}>
      {n} / 64 · SIXTY-FOUR RECORDS
    </div>
  </AbsoluteFill>
);

// One short of the Sixty-Four Records series. Parts are timed by seriesPlan from the drop.
export const Series: React.FC<SeriesProps> = (props) => {
  const { fps } = useVideoConfig();
  const grid: Grid = { fps, bpm: props.bpm, firstBeat: props.firstBeat };
  const s = seriesPlan(props.bpm, props.drop);
  const f = (b: number) => beatFrame(grid, b);
  const span = (a: number, b: number) => ({ from: f(a), durationInFrames: f(b) - f(a) });
  const half = s.meaningLength / 2;
  const hexEnd = s.hexagram + s.hexagramBeats;
  const screenBeats = (s.cta - s.showcase) / props.screens.length;
  const camera = seriesCuts(props.style, s, props.screens.length);
  return (
    <GridContext.Provider value={grid}>
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <FxDefs />
        <Soundtrack src={props.music} start={props.musicStart} fadeFrom={f(s.end - 2)} />
        <Camera {...camera}>
          <Sequence {...span(0, s.hexagram)}>
            <Hook text={props.hook} />
          </Sequence>
          <Sequence {...span(s.hexagram, hexEnd)}>
            <Hexagram3D hexagram={props.hexagram} clip={props.hexagramClip} />
          </Sequence>
          {/* After-drop timing with a drop later than the hexagram: rain until the drop. */}
          {s.mode === "after" && s.drop > hexEnd && (
            <Sequence {...span(hexEnd, s.drop)}>
              <CodeRain text="" showText={false} />
            </Sequence>
          )}
          {props.meaning.map((text, i) => (
            <Sequence key={text} {...span(s.meaning + i * half, s.meaning + (i + 1) * half)}>
              <CodeRain text={text} cuts={[{ frame: 0, src: props.plates[i] }]} />
            </Sequence>
          ))}
          <Sequence {...span(s.question, s.question + s.questionLength)}>
            <CodeRain text={props.question} />
          </Sequence>
          {props.screens.map((sc, i) => (
            <Sequence key={sc.src} {...span(s.showcase + i * screenBeats, s.showcase + (i + 1) * screenBeats)}>
              <CaptionScreen src={sc.src} caption={sc.caption} color={i % 2 ? "#ffb23f" : "#7dff8a"} seed={`cap-${i}`} boxed />
            </Sequence>
          ))}
          <Sequence {...span(s.cta, s.credit)}>
            <EndCard3D clip={props.endcard.clip} />
          </Sequence>
          <Sequence {...span(s.credit, s.end)}>
            <Credit name="~DISNEYFAN" />
          </Sequence>
        </Camera>
        <Sequence from={0} durationInFrames={f(s.drop)}>
          <Badge n={props.hexagram.number} />
        </Sequence>
        <Grain />
      </AbsoluteFill>
    </GridContext.Provider>
  );
};
