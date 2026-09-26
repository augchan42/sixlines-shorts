import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Camera, type Cut } from "../fx/Camera";
import { FxDefs, Grain } from "../fx/Glitch";
import { Searchlight } from "../fx/Searchlight";
import { Soundtrack } from "../fx/Soundtrack";
import { fonts } from "../lib/fonts";
import { sentenceBeat, seriesMotion } from "../lib/seriesMotion";
import { planOf } from "../lib/seriesPlan";
import { beatFrame, GridContext, type Grid } from "../lib/timing";
import type { SeriesProps } from "../schema";
import { CaptionScreen } from "../scenes/CaptionScreen";
import { CodeRain, TypedText } from "../scenes/CodeRain";
import { Credit } from "../scenes/Credit";
import { EndCard3D } from "../scenes/EndCard3D";
import { Hexagram3D } from "../scenes/Hexagram3D";
import { Hook } from "../scenes/Hook";
import { Painting } from "../scenes/Painting";
import { Readout } from "../scenes/Readout";
import { Trigrams } from "../scenes/Trigrams";

export const seriesFrames = (p: Pick<SeriesProps, "bpm" | "firstBeat" | "drop" | "lesson" | "pace" | "credit">, fps: number) =>
  beatFrame({ fps, bpm: p.bpm, firstBeat: p.firstBeat }, planOf(p).end);

// How far a character lesson's drawing moves down to clear room for its sentence above it (the demo's value).
const CHARACTER_DROP = 260;

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
  // A moon or character lesson plays its clip throughout and types its sentence over its end.
  const clipText = lesson ? sentenceBeat(s, lesson) : s.cta;
  const motion = seriesMotion(s, lesson);
  const cuts: Cut[] = [
    { beat: s.hexagram, kind: "zoom" },
    { beat: s.meaning, kind: "whip-up" },
    ...(props.pace === "held" ? [] : [{ beat: s.meaning + half, kind: "whip-left" as const }]),
    { beat: s.question, kind: "whip-right" },
    { beat: s.drop, kind: "zoom" },
    ...(lesson && !lesson.clip && !lesson.readout ? [{ beat: lessonHalf, kind: "whip-left" as const }] : []),
    ...props.screens.slice(1).map((_, i) => ({ beat: s.showcase + (i + 1) * screenBeats, kind: (i % 2 ? "whip-right" : "whip-left") as Cut["kind"] })),
    { beat: s.cta, kind: "zoom" },
    ...(props.credit ? [{ beat: s.credit, kind: "whip-up" as const }] : []),
  ];
  return (
    <GridContext.Provider value={grid}>
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <FxDefs />
        <Soundtrack src={props.music} start={props.musicStart} fadeFrom={f(s.end - 2)} />
        <Camera
          cuts={cuts}
          motion={motion.motion}
          shakes={motion.shakes}
        >
          <Sequence {...span(0, s.hexagram)}>
            <Hook text={props.hook} />
          </Sequence>
          <Sequence {...span(s.hexagram, hexEnd)}>
            <Hexagram3D hexagram={props.hexagram} clip={props.hexagramClip} />
          </Sequence>
          {props.pace === "held" ? (
            // One card: the second line types on under the first as the plate changes.
            <Sequence {...span(s.meaning, s.meaning + s.meaningLength)}>
              <CodeRain
                text={props.meaning[0]}
                then={{ frame: f(s.meaning + half) - f(s.meaning), text: props.meaning[1] }}
                cuts={[
                  { frame: 0, src: props.plates[0] },
                  { frame: f(s.meaning + half) - f(s.meaning), src: props.plates[1] },
                ]}
              />
            </Sequence>
          ) : (
            props.meaning.map((text, i) => (
              <Sequence key={text} {...span(s.meaning + i * half, s.meaning + (i + 1) * half)}>
                <CodeRain text={text} cuts={[{ frame: 0, src: props.plates[i] }]} />
              </Sequence>
            ))
          )}
          <Sequence {...span(s.question, s.question + s.questionLength)}>
            <CodeRain text={props.question} />
          </Sequence>
          {props.screens.map((sc, i) => (
            <Sequence key={sc.src} {...span(s.showcase + i * screenBeats, s.showcase + (i + 1) * screenBeats)}>
              <CaptionScreen src={sc.src} caption={sc.caption} color={i % 2 ? "#ffb23f" : "#7dff8a"} seed={`cap-${i}`} />
            </Sequence>
          ))}
          {lesson?.clip && (
            <>
              <Sequence {...span(s.showcase, s.cta)}>
                {/* A character sits low, its sentence above it, as in the demo: text at the bottom covered the drawing. */}
                <EndCard3D clip={lesson.clip} drop={lesson.kind === "character" ? CHARACTER_DROP : 0} />
              </Sequence>
              {lesson.kind !== "character" && !lesson.scene && (
                <Sequence {...span(s.showcase, clipText)}>
                  <Searchlight />
                </Sequence>
              )}
              <Sequence {...span(clipText, s.cta)}>
                <TypedText text={lesson.text} place={lesson.kind === "moon" ? "centre" : lesson.kind === "character" ? "top" : "bottom"} />
              </Sequence>
            </>
          )}
          {lesson?.readout && lesson.trigrams && (
            <Sequence {...span(s.showcase, s.cta)}>
              <Readout
                number={props.hexagram.number}
                name={props.hexagram.name}
                lines={props.hexagram.lines}
                trigrams={lesson.trigrams}
                text={lesson.text}
                mark={lesson.readout.mark}
                finding={lesson.readout.finding}
              />
            </Sequence>
          )}
          {lesson && !lesson.clip && !lesson.readout && (
            <>
              <Sequence {...span(s.showcase, lessonHalf)}>
                {lesson.trigrams ? (
                  <Trigrams lines={props.hexagram.lines} trigrams={lesson.trigrams} />
                ) : lesson.painting ? (
                  <Painting src={lesson.painting.src} credit={lesson.painting.credit} />
                ) : (
                  lesson.screen && <CaptionScreen src={lesson.screen.src} caption={lesson.screen.caption} color="#7dff8a" seed="lesson" />
                )}
                <Searchlight />
              </Sequence>
              <Sequence {...span(lessonHalf, s.cta)}>
                <CodeRain text={lesson.text} cuts={lesson.kind === "painting" && lesson.screen ? [{ frame: 0, src: lesson.screen.src }] : []} />
              </Sequence>
            </>
          )}
          <Sequence {...span(s.cta, s.credit)}>
            <EndCard3D clip={props.endcard.clip} />
          </Sequence>
          {props.credit && (
            <Sequence {...span(s.credit, s.end)}>
              <Credit name="~DISNEYFAN" />
            </Sequence>
          )}
        </Camera>
        <Sequence from={0} durationInFrames={f(s.drop)}>
          <Badge n={props.hexagram.number} />
        </Sequence>
        <Grain />
      </AbsoluteFill>
    </GridContext.Provider>
  );
};
