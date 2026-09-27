import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { Soundtrack } from "../fx/Soundtrack";
import { EndCard3D } from "../scenes/EndCard3D";
import { Readout, type Trigram } from "../scenes/Readout";

// The explainer for the readout screen (series/explainers/readout-key.json): one hexagram's
// readout, fully built, with each step typed at the prompt while the part it explains is lit
// and the rest dims; then the hexagram's end card. Rendered by scripts/explainer.mjs.
type Step = { at: number; text: string; focus: [number, string[]][] };
export type ReadoutKeyProps = {
  number: number;
  name: string;
  lines: (0 | 1)[];
  trigrams: [Trigram, Trigram];
  mark: number[];
  finding?: string;
  master?: { zh: string; en: string };
  steps: Step[];
  end: number;
  music: string;
  musicStart: number;
  endcard: { clip: string; seconds: number };
};

export const readoutKeyFrames = (p: ReadoutKeyProps, fps: number) => Math.round((p.end + p.endcard.seconds) * fps);

export const ReadoutKey: React.FC<ReadoutKeyProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const step = [...p.steps].reverse().find((s) => t >= s.at) ?? p.steps[0];
  const since = t - step.at;
  const [, focus] = [...step.focus].reverse().find(([after]) => since >= after) ?? step.focus[0];
  const endAt = Math.round(p.end * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Soundtrack src={p.music} start={p.musicStart} fadeFrom={readoutKeyFrames(p, fps) - 2 * fps} />
      <Sequence durationInFrames={endAt}>
        <Readout
          number={p.number}
          name={p.name}
          lines={p.lines}
          trigrams={p.trigrams}
          text=""
          mark={p.mark}
          finding={p.finding}
          master={p.master}
          built
          focus={focus}
          marked={focus.includes("mark")}
          prompt={{ text: step.text, at: Math.round(step.at * fps) }}
        />
      </Sequence>
      <Sequence from={endAt}>
        <EndCard3D clip={p.endcard.clip} />
      </Sequence>
    </AbsoluteFill>
  );
};
