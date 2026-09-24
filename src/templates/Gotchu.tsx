import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { Camera, type Cut, type Motion, type Shake } from "../fx/Camera";
import { FxDefs, Grain } from "../fx/Glitch";
import { Soundtrack } from "../fx/Soundtrack";
import { beatFrame, GridContext, useGrid, type Grid } from "../lib/timing";
import type { GotchuProps } from "../schema";
import { CaptionScreen } from "../scenes/CaptionScreen";
import { ClockScreen } from "../scenes/ClockScreen";
import { CodeRain } from "../scenes/CodeRain";
import { EndCard } from "../scenes/EndCard";
import { Hook } from "../scenes/Hook";
import { Hexagram3D } from "../scenes/Hexagram3D";
import { Hexagram, PatternLine } from "../scenes/Montage";
import { Reveal } from "../scenes/Reveal";
import { Showcase } from "../scenes/Showcase";
import { TiltedScreen } from "../scenes/TiltedScreen";

const CAPTION_COLORS = ["#7dff8a", "#ffb23f"];

// Section starts in beats. From the reply on, every section is a multiple of four beats
// (with an 8-plate run), so when the music's bars start on beat 3, as in Syncopation
// Heaven, every section starts on a bar.
export const gotchuPlan = (props: GotchuProps) => {
  const reply = 3;
  const clock = reply + 4;
  const verses = clock + 4;
  const hexagram = verses + props.verses.length * 4;
  const breakdown = hexagram + 4;
  const showcase = breakdown + 4;
  const run = showcase + props.captions.length * 4;
  const screens = run + Math.ceil(props.run.length / 2);
  const reveal = screens + props.screens.length * 4;
  const endCard = reveal + 4;
  const end = endCard + 4;
  return { reply, clock, verses, hexagram, breakdown, showcase, run, screens, reveal, endCard, end };
};

const gotchuCamera = (props: GotchuProps) => {
  const p = gotchuPlan(props);
  const whip = (i: number): Cut["kind"] => (i % 2 === 0 ? "whip-left" : "whip-right");
  const cuts: Cut[] = [
    { beat: p.reply, kind: "zoom" },
    { beat: p.clock, kind: "whip-up" },
    ...props.verses.map((_, i) => ({ beat: p.verses + i * 4, kind: whip(i) })),
    { beat: p.hexagram, kind: "zoom" },
    { beat: p.breakdown, kind: "whip-left" },
    { beat: p.showcase, kind: "zoom" },
    { beat: p.run, kind: "zoom" },
    ...props.screens.map((_, i) => ({ beat: p.screens + i * 4, kind: whip(i + 1) })),
    { beat: p.reveal, kind: "zoom" },
  ];
  // Beat punches pause while the hits play, so the syncopation reads.
  const lastHit = Math.max(p.showcase, ...props.hits);
  const motion: Motion[] = [
    { beat: -10, punch: 0, sway: 0.3 },
    { beat: p.clock, punch: 0.03, sway: 0.5 },
    { beat: p.breakdown, punch: 0, sway: 0.2 },
    { beat: p.showcase, punch: 0, sway: 0.6 },
    { beat: Math.floor(lastHit) + 1, punch: 0.06, sway: 0.6 },
    { beat: p.run, punch: 0.07, sway: 0.5 },
    { beat: p.reveal, punch: 0, sway: 0.2 },
  ];
  const shakes: Shake[] = [
    { beat: p.hexagram, strength: 20, beats: 1 },
    // The drop.
    { beat: p.showcase, strength: 45, beats: 1 },
  ];
  return { cuts, motion, shakes, hits: props.hits };
};

// A white flash on each hit, gone within a few frames.
const HitFlash: React.FC<{ hits: number[] }> = ({ hits }) => {
  const frame = useCurrentFrame();
  const grid = useGrid();
  const age = Math.min(...hits.map((b) => frame - beatFrame(grid, b)).filter((a) => a >= 0), Infinity);
  const opacity = age < 5 ? 0.45 * Math.exp(-age / 1.5) : 0;
  return <AbsoluteFill style={{ backgroundColor: "#fff", opacity, mixBlendMode: "screen" }} />;
};

export const Gotchu: React.FC<GotchuProps> = (props) => {
  const { fps } = useVideoConfig();
  const grid: Grid = { fps, bpm: props.bpm, firstBeat: props.firstBeat };
  const p = gotchuPlan(props);
  const f = (beat: number) => beatFrame(grid, beat);
  const span = (from: number, to: number) => ({ from: f(from), durationInFrames: f(to) - f(from) });

  // Hits after the breakdown's first beat each cut to the next breakdown plate; the rain
  // itself holds the first beat.
  const breakdownCuts = props.hits
    .filter((h) => h > p.breakdown && h < p.showcase)
    .map((h, i) => ({ frame: f(h) - f(p.breakdown), src: props.breakdownArt[i % props.breakdownArt.length] }));
  // The showcase art changes on each hit, then every two beats until the punch-in. The
  // hits after the drop show the plate alone, without the icon and caption.
  const showcaseHits = props.hits.filter((h) => h >= p.showcase && h < p.run);
  const showcaseSwaps = [p.showcase, ...showcaseHits.filter((h) => h > p.showcase)];
  for (let b = showcaseSwaps[showcaseSwaps.length - 1] + 2; b < p.run - 2; b += 2) showcaseSwaps.push(b);

  return (
    <GridContext.Provider value={grid}>
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <FxDefs />
        <Soundtrack src={props.music} start={props.musicStart} fadeFrom={f(p.end - 2)} />
        <Camera {...gotchuCamera(props)}>
          <Sequence from={0} durationInFrames={f(p.reply)}>
            <Hook text={props.hook} />
          </Sequence>
          <Sequence {...span(p.reply, p.clock)}>
            <Hook text={props.reply} />
          </Sequence>
          <Sequence {...span(p.clock, p.verses)}>
            <ClockScreen src={props.clock.screen} backdrop={props.clock.backdrop} />
          </Sequence>
          {props.verses.map((src, i) => (
            <Sequence key={src} {...span(p.verses + i * 4, p.verses + i * 4 + 4)}>
              <TiltedScreen src={src} flip={i % 2 === 1} seed={`verse-${i}`} />
            </Sequence>
          ))}
          <Sequence {...span(p.hexagram, p.breakdown)}>
            {props.hexagramClip ? (
              <Hexagram3D hexagram={props.hexagram} clip={props.hexagramClip} />
            ) : (
              <Hexagram hexagram={props.hexagram} />
            )}
          </Sequence>
          <Sequence {...span(p.breakdown, p.showcase)}>
            <CodeRain text={props.breakdown} cuts={breakdownCuts} />
          </Sequence>
          <Sequence {...span(p.showcase, p.run)}>
            <Showcase
              icon={props.icon}
              art={props.showcaseArt}
              captions={props.captions}
              swaps={showcaseSwaps.map((b) => f(b) - f(p.showcase))}
              bare={showcaseHits.filter((h) => h > p.showcase).map((b) => f(b) - f(p.showcase))}
            />
          </Sequence>
          <Sequence {...span(p.run, p.screens)}>
            <PatternLine text={props.pattern} plates={props.run} />
          </Sequence>
          {props.screens.map((s, i) => (
            <Sequence key={s.src} {...span(p.screens + i * 4, p.screens + i * 4 + 4)}>
              <CaptionScreen src={s.src} caption={s.caption} color={CAPTION_COLORS[i % 2]} seed={`cap-${i}`} />
            </Sequence>
          ))}
          <Sequence {...span(p.reveal, p.endCard)}>
            <Reveal text={props.reveal} />
          </Sequence>
          <Sequence {...span(p.endCard, p.end)}>
            <EndCard credit={props.credit} cta={props.cta} icon={props.icon} />
          </Sequence>
        </Camera>
        <HitFlash hits={props.hits} />
        <Grain />
      </AbsoluteFill>
    </GridContext.Provider>
  );
};
