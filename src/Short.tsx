import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { FxDefs, Grain } from "./fx/Glitch";
import { beatFrame, GridContext, type Grid } from "./lib/timing";
import type { ShortProps } from "./schema";
import { EndCard } from "./scenes/EndCard";
import { Hook } from "./scenes/Hook";
import { Montage } from "./scenes/Montage";
import { Rivals } from "./scenes/Rivals";
import { Showcase } from "./scenes/Showcase";
import { Turn } from "./scenes/Turn";

const RIVAL_BEATS = 4;

// Scene boundaries in beats. The hook runs from frame 0 to the end of beat 2.
export const plan = (props: ShortProps) => {
  const rivalsEnd = 2 + props.rivals.length * RIVAL_BEATS;
  const turnEnd = rivalsEnd + 4;
  const showcaseEnd = turnEnd + props.captions.length * 4 + 2;
  const montageEnd = showcaseEnd + 10;
  const end = montageEnd + 5;
  return { rivalsEnd, turnEnd, showcaseEnd, montageEnd, end };
};

export const Short: React.FC<ShortProps> = (props) => {
  const { fps } = useVideoConfig();
  const grid: Grid = { fps, bpm: props.bpm, firstBeat: props.firstBeat };
  const p = plan(props);
  const f = (beat: number) => beatFrame(grid, beat);
  const span = (from: number, to: number) => ({ from: f(from), durationInFrames: f(to) - f(from) });

  return (
    <GridContext.Provider value={grid}>
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <FxDefs />
        {props.music && <Audio src={staticFile(props.music)} />}
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
          <Showcase icon={props.icon} art={props.art} captions={props.captions} />
        </Sequence>
        <Sequence {...span(p.showcaseEnd, p.montageEnd)}>
          <Montage hexagram={props.hexagram} pattern={props.pattern} art={props.art} screens={props.screens} />
        </Sequence>
        <Sequence {...span(p.montageEnd, p.end)}>
          <EndCard credit={props.credit} cta={props.cta} icon={props.icon} />
        </Sequence>
        <Grain />
      </AbsoluteFill>
    </GridContext.Provider>
  );
};
