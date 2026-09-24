import { Composition, staticFile } from "remotion";
import { hexagramClip } from "./lib/clips";
import { beatFrame } from "./lib/timing";
import { gotchuSchema, shortSchema, type GotchuProps, type ShortProps } from "./schema";
import { CodeRain } from "./scenes/CodeRain";
import { plan, Short } from "./Short";
import { qian } from "./specs/qian";
import { gotchuQian } from "./specs/gotchu-qian";
import { qianGlowline } from "./specs/qian-glowline";
import { Gotchu, gotchuPlan } from "./templates/Gotchu";

const FPS = 30;

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
  </>
);
