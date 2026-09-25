import { Composition, staticFile } from "remotion";
import table from "../series/hexagrams.json";
import walkthrough from "../series/demo/walkthrough.json";
import { hexagramClip } from "./lib/clips";
import { beatFrame } from "./lib/timing";
import { gotchuSchema, seriesSchema, shortSchema, type GotchuProps, type SeriesProps, type ShortProps } from "./schema";
import { CodeRain } from "./scenes/CodeRain";
import { plan, Short } from "./Short";
import { qian } from "./specs/qian";
import { gotchuQian } from "./specs/gotchu-qian";
import { qianGlowline } from "./specs/qian-glowline";
import { Demo, demoFrames, type DemoProps } from "./templates/Demo";
import { Gotchu, gotchuPlan } from "./templates/Gotchu";
import { Series, seriesFrames } from "./templates/Series";
import { overrides } from "./series/overrides";
import { seriesProps, type SeriesRow } from "./series/props";
import { Series1, spike1Frames } from "./prototypes/Series1";
import { protoFrames, SeriesProto } from "./prototypes/SeriesProto";
import { protos } from "./prototypes/protos";

const FPS = 30;

// The studio opens on 29; scripts/series.mjs passes each hexagram's props with --props.
const row29 = (table as SeriesRow[]).find((r) => r.number === 29)!;

const calculateMetadata = ({ props }: { props: ShortProps }) => ({
  durationInFrames: beatFrame({ fps: FPS, bpm: props.bpm, firstBeat: props.firstBeat }, plan(props).end),
});

const shorts: { id: string; props: ShortProps }[] = [
  { id: "Qian", props: qian },
  { id: "QianGlowline", props: qianGlowline },
];

export const Root: React.FC = () => (
  <>
    {shorts.map(({ id, props }) => (
      <Composition
        key={id}
        id={id}
        component={Short}
        schema={shortSchema}
        defaultProps={props}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={1}
        calculateMetadata={calculateMetadata}
      />
    ))}
    {/* The glyph rain alone, as the backdrop texture for blender/hexagram.py. */}
    <Composition
      id="RainPlate"
      component={() => <CodeRain text="" showText={false} />}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={120}
    />
    <Composition
      id="GotchuQian"
      component={Gotchu}
      schema={gotchuSchema}
      defaultProps={gotchuQian}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={1}
      calculateMetadata={async ({ props }: { props: GotchuProps }) => {
        const p = gotchuPlan(props);
        if (props.hexagramClip) {
          const beats = p.breakdown - p.hexagram;
          const expected = hexagramClip(props.hexagram.lines, props.bpm, beats);
          const make = `npm run blender -- --lines ${props.hexagram.lines.join("")} --bpm ${props.bpm} --beats ${beats}`;
          if (props.hexagramClip !== expected) {
            throw new Error(`hexagramClip is ${props.hexagramClip}, but this hexagram and tempo need ${expected}. Make it with: ${make}`);
          }
          const res = await fetch(staticFile(props.hexagramClip));
          await res.body?.cancel();
          if (!res.ok) throw new Error(`${props.hexagramClip} is missing. Make it with: ${make}`);
        }
        return { durationInFrames: beatFrame({ fps: FPS, bpm: props.bpm, firstBeat: props.firstBeat }, p.end) };
      }}
    />
    <Composition
      id="Series"
      component={Series}
      schema={seriesSchema}
      defaultProps={seriesProps(row29, overrides[29])}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={1}
      calculateMetadata={async ({ props }: { props: SeriesProps }) => {
        for (const file of [props.hexagramClip, props.music]) {
          const res = await fetch(staticFile(file));
          await res.body?.cancel();
          if (!res.ok) throw new Error(`${file} is missing. Run: npm run series:clips -- ${props.hexagram.number}`);
        }
        return { durationInFrames: seriesFrames(props, FPS) };
      }}
    />
    {/* The app demo walkthrough (series/demo/walkthrough.json), rendered by scripts/demo.mjs. */}
    <Composition
      id="Demo"
      component={Demo}
      defaultProps={walkthrough as unknown as DemoProps}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={1}
      calculateMetadata={({ props }: { props: DemoProps }) => ({ durationInFrames: demoFrames(props, FPS) })}
    />
    <Composition id="Spike1" component={Series1} width={1080} height={1920} fps={FPS} durationInFrames={spike1Frames(FPS)} />
    {protos.map(({ id, props }) => (
      <Composition key={id} id={id} component={SeriesProto} defaultProps={props} width={1080} height={1920} fps={FPS} durationInFrames={protoFrames(props, FPS)} />
    ))}
  </>
);
