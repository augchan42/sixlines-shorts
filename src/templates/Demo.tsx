import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import { Camera, type Cut } from "../fx/Camera";
import { FxDefs, Grain } from "../fx/Glitch";
import { Soundtrack } from "../fx/Soundtrack";
import { beatFrame, GridContext, type Grid } from "../lib/timing";
import { CodeRain, TypedText } from "../scenes/CodeRain";
import { Credit } from "../scenes/Credit";
import { EndCard3D } from "../scenes/EndCard3D";
import { Hexagram3D } from "../scenes/Hexagram3D";
import type { ShortProps } from "../schema";

type Take = { file: string };
type Shot =
  | { beats: [number, number]; kind: "rain"; text: string }
  | { beats: [number, number]; kind: "live"; take: string; from: number; rate: number; zoom?: number; focus?: number; place?: "top" | "bottom"; text: string }
  | { beats: [number, number]; kind: "hexagram"; clip: string; text: string }
  | { beats: [number, number]; kind: "clip"; clip: string; texts: { beat: number; text: string }[] }
  | { beats: [number, number]; kind: "endcard"; clip: string }
  | { beats: [number, number]; kind: "credit"; name: string };

// series/demo/walkthrough.json
export type DemoProps = {
  bpm: number;
  firstBeat: number;
  music: string;
  musicStart: number;
  hexagram: ShortProps["hexagram"];
  takes: Record<string, Take>;
  shots: Shot[];
};

export const demoFrames = (p: DemoProps, fps: number) =>
  beatFrame({ fps, bpm: p.bpm, firstBeat: p.firstBeat }, Math.max(...p.shots.map((s) => s.beats[1])));

// The typed box fits the longest line across the frame.
const sizeFor = (text: string) => Math.min(100, Math.floor(1880 / Math.max(...text.split("\n").map((l) => l.length))));

// A simulator recording (1320x2868), filling the frame's width, cropped by `zoom` around
// `focus` (0 top of the phone screen, 1 bottom).
const Live: React.FC<{ src: string; from: number; rate: number; zoom: number; focus: number }> = ({ src, from, rate, zoom, focus }) => {
  const { width, height, fps } = useVideoConfig();
  const w = width * zoom;
  const h = (w * 2868) / 1320;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(src)}
        muted
        trimBefore={Math.round(from * fps)}
        playbackRate={rate}
        style={{ position: "absolute", width: w, height: h, left: (width - w) / 2, top: -(h - height) * focus }}
      />
    </AbsoluteFill>
  );
};

// The Six Lines demo walkthrough: live app shots between the neon Blender pieces, with
// music and burned-in text. Whip cuts between shots, as in the series.
export const Demo: React.FC<DemoProps> = (props) => {
  const { fps } = useVideoConfig();
  const grid: Grid = { fps, bpm: props.bpm, firstBeat: props.firstBeat };
  const f = (b: number) => beatFrame(grid, b);
  const span = (a: number, b: number) => ({ from: f(a), durationInFrames: f(b) - f(a) });
  const end = Math.max(...props.shots.map((s) => s.beats[1]));
  const kinds: Cut["kind"][] = ["whip-left", "whip-right", "whip-up"];
  const cuts: Cut[] = props.shots.slice(1).map((s, i) => ({
    beat: s.beats[0],
    kind: s.kind === "hexagram" || s.kind === "endcard" ? "zoom" : kinds[i % kinds.length],
  }));
  const typed = (text: string, place: "centre" | "bottom" | "top") => <TypedText text={text} place={place} size={sizeFor(text)} />;
  return (
    <GridContext.Provider value={grid}>
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <FxDefs />
        <Soundtrack src={props.music} start={props.musicStart} fadeFrom={f(end - 2)} />
        <Camera cuts={cuts} motion={[{ beat: 0, punch: 0, sway: 0.15 }]} shakes={[]}>
          {props.shots.map((s, i) => {
            const [a, b] = s.beats;
            return (
              <Sequence key={i} {...span(a, b)}>
                {s.kind === "rain" && (
                  <>
                    <CodeRain text="" showText={false} />
                    {typed(s.text, "centre")}
                  </>
                )}
                {s.kind === "live" && (
                  <>
                    <Live src={props.takes[s.take].file} from={s.from} rate={s.rate} zoom={s.zoom ?? 1} focus={s.focus ?? 0.5} />
                    {typed(s.text, s.place ?? "bottom")}
                  </>
                )}
                {s.kind === "hexagram" && (
                  <>
                    <Hexagram3D hexagram={props.hexagram} clip={s.clip} />
                    {typed(s.text, "top")}
                  </>
                )}
                {s.kind === "clip" && (
                  <>
                    <AbsoluteFill style={{ backgroundColor: "#000" }}>
                      <OffthreadVideo src={staticFile(s.clip)} muted style={{ width: "100%", height: "100%" }} />
                    </AbsoluteFill>
                    {s.texts.map((t, k) => (
                      <Sequence key={k} {...span(t.beat - a, (s.texts[k + 1]?.beat ?? b) - a)}>
                        {typed(t.text, "bottom")}
                      </Sequence>
                    ))}
                  </>
                )}
                {s.kind === "endcard" && <EndCard3D clip={s.clip} />}
                {s.kind === "credit" && <Credit name={s.name} />}
              </Sequence>
            );
          })}
        </Camera>
        <Grain />
      </AbsoluteFill>
    </GridContext.Provider>
  );
};
