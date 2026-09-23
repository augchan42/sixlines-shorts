import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { Camera, type Cut, type Motion, type Shake } from "./fx/Camera";
import { FxDefs, Grain } from "./fx/Glitch";
import { beatFrame, GridContext, type Grid } from "./lib/timing";
import type { ShortProps } from "./schema";
import { EndCard } from "./scenes/EndCard";
import { Hook } from "./scenes/Hook";
import { Montage, montageBeats } from "./scenes/Montage";
import { Rivals } from "./scenes/Rivals";
import { Showcase } from "./scenes/Showcase";
import { Turn } from "./scenes/Turn";

const RIVAL_BEATS = 4;

// Scene boundaries in beats. The hook runs from frame 0 to the end of beat 2.
export const plan = (props: ShortProps) => {
  const rivalsEnd = 2 + props.rivals.length * RIVAL_BEATS;
  const turnEnd = rivalsEnd + 4;
  const showcaseEnd = turnEnd + props.captions.length * 4 + 2;
  const montageEnd = showcaseEnd + montageBeats(props).end;
  const end = montageEnd + 5;
  return { rivalsEnd, turnEnd, showcaseEnd, montageEnd, end };
};

// Where the camera cuts, punches and shakes, all in beats.
export const cameraPlan = (props: ShortProps) => {
  const p = plan(props);
  const m = montageBeats(props);
  const rivalCuts: Cut[] = props.rivals.slice(1).map((_, i) => ({
    beat: 2 + (i + 1) * RIVAL_BEATS,
    kind: i % 2 === 0 ? "whip-left" : "whip-right",
  }));
  const cuts: Cut[] = [
    { beat: 2, kind: "zoom" },
    ...rivalCuts,
    { beat: p.rivalsEnd, kind: "whip-up" },
    { beat: p.turnEnd, kind: "zoom" },
    { beat: p.showcaseEnd, kind: "zoom" },
    { beat: p.showcaseEnd + m.run, kind: "whip-left" },
    { beat: p.showcaseEnd + m.screens, kind: "zoom" },
    { beat: p.showcaseEnd + m.dissolve, kind: "whip-right" },
  ];
  const motion: Motion[] = [
    { beat: -10, punch: 0, sway: 0.3 },
    { beat: 2, punch: 0.05, sway: 0.6 },
    { beat: p.rivalsEnd, punch: 0.02, sway: 0.4 },
    { beat: p.turnEnd, punch: 0.03, sway: 0.8 },
    { beat: p.showcaseEnd, punch: 0.07, sway: 0.5 },
    { beat: p.montageEnd, punch: 0, sway: 0.2 },
  ];
  const shakes: Shake[] = [
    // Each MOGGED stamp lands two beats into its rival.
    ...props.rivals.map((_, i) => ({ beat: 2 + i * RIVAL_BEATS + 2, strength: 34, beats: 1 })),
    { beat: p.rivalsEnd + 1.5, strength: 20, beats: 1 },
    { beat: p.showcaseEnd, strength: 40, beats: 1 },
  ];
  return { cuts, motion, shakes };
};

export const Short: React.FC<ShortProps> = (props) => {
  const { fps, durationInFrames } = useVideoConfig();
  const grid: Grid = { fps, bpm: props.bpm, firstBeat: props.firstBeat };
  const p = plan(props);
  const f = (beat: number) => beatFrame(grid, beat);
  const span = (from: number, to: number) => ({ from: f(from), durationInFrames: f(to) - f(from) });
  const camera = cameraPlan(props);

  return (
    <GridContext.Provider value={grid}>
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <FxDefs />
        {props.music && (
          <Audio
            src={staticFile(props.music)}
            trimBefore={Math.round(props.musicStart * fps)}
            // Fade out over the last two beats of the end card.
            volume={(frame) =>
              interpolate(frame, [f(p.end - 2), durationInFrames], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            }
          />
        )}
        <Camera {...camera}>
          <Sequence from={0} durationInFrames={f(2)}>
            <Hook text={props.hook} />
          </Sequence>
          <Sequence {...span(2, p.rivalsEnd)}>
            <Rivals rivals={props.rivals} verdict={props.verdict} beatsEach={RIVAL_BEATS} />
          </Sequence>
          <Sequence {...span(p.rivalsEnd, p.turnEnd)}>
            <Turn text={props.turn} icon={props.icon} />
          </Sequence>
          <Sequence {...span(p.turnEnd, p.showcaseEnd)}>
            <Showcase icon={props.icon} art={props.art.showcase} captions={props.captions} />
          </Sequence>
          <Sequence {...span(p.showcaseEnd, p.montageEnd)}>
            <Montage hexagram={props.hexagram} pattern={props.pattern} art={props.art} screens={props.screens} />
          </Sequence>
          <Sequence {...span(p.montageEnd, p.end)}>
            <EndCard credit={props.credit} cta={props.cta} icon={props.icon} />
          </Sequence>
        </Camera>
        <Grain />
      </AbsoluteFill>
    </GridContext.Provider>
  );
};
