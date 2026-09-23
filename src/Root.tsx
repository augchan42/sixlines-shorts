import { Composition } from "remotion";
import { beatFrame } from "./lib/timing";
import { shortSchema, type ShortProps } from "./schema";
import { plan, Short } from "./Short";
import { qian } from "./specs/qian";
import { qianGlowline } from "./specs/qian-glowline";

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
  </>
);
