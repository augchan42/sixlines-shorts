import { Composition } from "remotion";
import { beatFrame } from "./lib/timing";
import { shortSchema, type ShortProps } from "./schema";
import { plan, Short } from "./Short";
import { qian } from "./specs/qian";

const FPS = 30;

export const Root: React.FC = () => (
  <Composition
    id="Qian"
    component={Short}
    schema={shortSchema}
    defaultProps={qian}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={1}
    calculateMetadata={({ props }: { props: ShortProps }) => ({
      durationInFrames: beatFrame({ fps: FPS, bpm: props.bpm, firstBeat: props.firstBeat }, plan(props).end),
    })}
  />
);
