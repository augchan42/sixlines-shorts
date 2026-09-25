import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Camera, type Cut } from "../fx/Camera";
import { FxDefs, Grain } from "../fx/Glitch";
import { Soundtrack } from "../fx/Soundtrack";
import { fonts } from "../lib/fonts";
import { planOf } from "../lib/seriesPlan";
import { beatFrame, GridContext, type Grid } from "../lib/timing";
import type { SeriesProps } from "../schema";
import { CaptionScreen } from "../scenes/CaptionScreen";
import { CodeRain } from "../scenes/CodeRain";
import { Credit } from "../scenes/Credit";
import { EndCard3D } from "../scenes/EndCard3D";
import { Hexagram3D } from "../scenes/Hexagram3D";
import { Hook } from "../scenes/Hook";
import { Trigrams } from "../scenes/Trigrams";

export const seriesFrames = (p: Pick<SeriesProps, "bpm" | "firstBeat" | "drop" | "lesson">, fps: number) =>
  beatFrame({ fps, bpm: p.bpm, firstBeat: p.firstBeat }, planOf(p).end);

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
  const s = planOf(props);
  const f = (b: number) => beatFrame(grid, b);
  const span = (a: number, b: number) => ({ from: f(a), durationInFrames: f(b) - f(a) });
  const half = s.meaningLength / 2;
  const hexEnd = s.hexagram + s.hexagramBeats;
  const screenBeats = (s.cta - s.showcase) / Math.max(1, props.screens.length);
  // A lesson shows its picture for the first half, then its sentence.
  const lessonHalf = s.showcase + (s.cta - s.showcase) / 2;
  const lesson = props.lesson;
  const cuts: Cut[] = [
    { beat: s.hexagram, kind: "zoom" },
    { beat: s.meaning, kind: "whip-up" },
    { beat: s.meaning + half, kind: "whip-left" },
    { beat: s.question, kind: "whip-right" },
    { beat: s.drop, kind: "zoom" },
    ...(lesson ? [{ beat: lessonHalf, kind: "whip-left" as const }] : []),
    ...props.screens.slice(1).map((_, i) => ({ beat: s.showcase + (i + 1) * screenBeats, kind: (i % 2 ? "whip-right" : "whip-left") as Cut["kind"] })),
    { beat: s.cta, kind: "zoom" },
    { beat: s.credit, kind: "whip-up" },
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
          <Sequence {...span(s.hexagram, hexEnd)}>
            <Hexagram3D hexagram={props.hexagram} clip={props.hexagramClip} />
          </Sequence>
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
              <CaptionScreen src={sc.src} caption={sc.caption} color={i % 2 ? "#ffb23f" : "#7dff8a"} seed={`cap-${i}`} />
            </Sequence>
          ))}
          {lesson && (
            <>
              <Sequence {...span(s.showcase, lessonHalf)}>
                {lesson.trigrams ? (
                  <Trigrams lines={props.hexagram.lines} trigrams={lesson.trigrams} />
                ) : (
                  lesson.screen && <CaptionScreen src={lesson.screen.src} caption={lesson.screen.caption} color="#7dff8a" seed="lesson" />
                )}
              </Sequence>
              <Sequence {...span(lessonHalf, s.cta)}>
                <CodeRain text={lesson.text} cuts={lesson.kind === "painting" && lesson.screen ? [{ frame: 0, src: lesson.screen.src }] : []} />
              </Sequence>
            </>
          )}
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
