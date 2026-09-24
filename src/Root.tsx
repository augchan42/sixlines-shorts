import { Composition } from "remotion";
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
      calculateMetadata={({ props }: { props: GotchuProps }) => ({
        durationInFrames: beatFrame({ fps: FPS, bpm: props.bpm, firstBeat: props.firstBeat }, gotchuPlan(props).end),
      })}
    />
  </>
);
