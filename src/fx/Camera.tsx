import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { beatFrame, framesPerBeat, jitter, useGrid } from "../lib/timing";
import { RGBSplit } from "./Glitch";

// A cut between two shots. Whips smear the frame sideways (or up) across the cut;
// a zoom pushes into the outgoing shot and lands the incoming one from zoomed in; a dip
// fades through black; a line wipe sweeps a glowing green line down the frame, covering the
// outgoing shot and uncovering the incoming one; a plain cut has no transition.
// `beats` is how long each side of a dip or line wipe takes (default 4 frames).
export type Cut = { beat: number; kind: "whip-left" | "whip-right" | "whip-up" | "zoom" | "dip" | "line" | "cut"; beats?: number };

// From `beat` until the next segment: how hard the frame punches on each beat,
// and how much it drifts like a handheld camera.
export type Motion = { beat: number; punch: number; sway: number };

// A burst of shake starting on `beat`, fading over `beats`.
export type Shake = { beat: number; strength: number; beats: number };

// An accent: a hard punch-in that decays over a few frames.
export type Hit = number;

// Frames on each side of a cut that the transition occupies.
const HALF = 4;

const easeIn = (t: number) => t * t * t;

// Offset, scale and blur for a frame near a cut. `u` is frames from the cut; negative
// means the outgoing shot. Returns null outside the transition window.
const cutPose = (cut: Cut, u: number, h: number, width: number, height: number) => {
  if (cut.kind === "cut" || cut.kind === "line" || u < -h || u >= h) return null;
  // 0 far from the cut, 1 on it.
  const q = u < 0 ? (u + h) / h : 1 - u / h;
  if (cut.kind === "dip") return { x: 0, y: 0, scale: 1, blurX: 0, blurY: 0, bright: 1 - Math.sin((q * Math.PI) / 2) };
  const p = easeIn(q);
  if (cut.kind === "zoom") {
    const scale = u < 0 ? 1 + p * 0.9 : 1 + p * 0.6;
    return { x: 0, y: 0, scale, blurX: p * 18, blurY: p * 18, bright: 1 + p * 0.6 };
  }
  // The outgoing shot leaves in the whip direction, the incoming one arrives from the other side.
  const side = u < 0 ? 1 : -1;
  if (cut.kind === "whip-up") {
    return { x: 0, y: -side * p * height * 0.45, scale: 1 + p * 0.1, blurX: 0, blurY: p * 90, bright: 1 };
  }
  const dir = cut.kind === "whip-left" ? -1 : 1;
  return { x: dir * side * p * width * 0.45, y: 0, scale: 1 + p * 0.1, blurX: p * 90, blurY: 0, bright: 1 };
};

// Moves the whole frame: beat punches, sway, shake and cut transitions.
export const Camera: React.FC<{
  cuts: Cut[];
  motion: Motion[];
  shakes: Shake[];
  hits?: Hit[];
  // Beats with a white flash, and beats with an RGB-split burst, each fading over 6 frames.
  flashes?: number[];
  glitches?: number[];
  children: React.ReactNode;
}> = ({ cuts, motion, shakes, hits = [], flashes = [], glitches = [], children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const grid = useGrid();
  const at = (beat: number) => beatFrame(grid, beat);

  const segment = [...motion].reverse().find((m) => frame >= at(m.beat)) ?? { punch: 0, sway: 0 };

  // Beat punch: a quick scale kick on each beat that decays over a few frames,
  // with the tilt alternating left and right.
  const beatNow = Math.floor(((frame / grid.fps - grid.firstBeat) * grid.bpm) / 60);
  const sinceBeat = frame - at(beatNow);
  const kick = beatNow >= 0 ? Math.exp(-sinceBeat / 3) : 0;
  // Overscan so sway and shake never expose the frame edge.
  let scale = (1 + segment.punch * kick) * (1 + segment.sway * 0.04);
  let rotate = segment.punch * kick * 12 * (beatNow % 2 === 0 ? 1 : -1);

  // Sway: slow, smooth drift from summed sines.
  let x = segment.sway * (Math.sin(frame / 23) + 0.5 * Math.sin(frame / 9.7)) * 14;
  let y = segment.sway * (Math.cos(frame / 29) + 0.5 * Math.sin(frame / 12.3)) * 14;
  rotate += segment.sway * Math.sin(frame / 31) * 0.8;

  for (const s of shakes) {
    const age = frame - at(s.beat);
    const span = at(s.beat + s.beats) - at(s.beat);
    if (age < 0 || age >= span) continue;
    const decay = interpolate(age, [0, span], [1, 0]);
    x += jitter(`shake-x-${s.beat}`, frame, 1) * s.strength * decay;
    y += jitter(`shake-y-${s.beat}`, frame, 1) * s.strength * decay;
    rotate += jitter(`shake-r-${s.beat}`, frame, 1) * s.strength * decay * 0.06;
  }

  hits.forEach((beat, i) => {
    const age = frame - at(beat);
    if (age < 0 || age > 8) return;
    const k = Math.exp(-age / 2.5);
    scale *= 1 + 0.14 * k;
    rotate += 2.5 * k * (i % 2 === 0 ? 1 : -1);
  });

  let blurX = 0;
  let blurY = 0;
  let bright = 1;
  const half = (cut: Cut) => (cut.beats ? cut.beats * framesPerBeat(grid) : HALF);
  // Fading bursts: 1 on the beat, 0 six frames later.
  const burst = (beats: number[]) =>
    Math.max(0, ...beats.map((b) => frame - at(b)).filter((age) => age >= 0 && age < 6).map((age) => 1 - age / 6));
  const flash = burst(flashes);
  const glitch = burst(glitches);

  // The line wipe: black above the line on the outgoing shot, below it on the incoming one.
  let wipe: { top: number; bottom: number; line: number } | null = null;
  for (const cut of cuts.filter((c) => c.kind === "line")) {
    const u = frame - at(cut.beat);
    const h = half(cut);
    if (u < -h || u >= h) continue;
    const y = u < 0 ? ((u + h) / h) * height : (u / h) * height;
    wipe = u < 0 ? { top: 0, bottom: height - y, line: y } : { top: y, bottom: 0, line: y };
  }

  for (const cut of cuts) {
    const pose = cutPose(cut, frame - at(cut.beat), half(cut), width, height);
    if (!pose) continue;
    x += pose.x;
    y += pose.y;
    scale *= pose.scale;
    blurX = pose.blurX;
    blurY = pose.blurY;
    bright = pose.bright;
  }

  const blurred = blurX > 0.5 || blurY > 0.5;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {blurred && (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id="camera-blur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={`${blurX} ${blurY}`} />
          </filter>
        </svg>
      )}
      <AbsoluteFill
        style={{
          transform: `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`,
          filter:
            [blurred ? "url(#camera-blur)" : "", bright !== 1 ? `brightness(${bright})` : ""].join(" ").trim() ||
            undefined,
        }}
      >
        <RGBSplit amount={glitch * 22} seed="camera-glitch">
          {children}
        </RGBSplit>
      </AbsoluteFill>
      {wipe && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: wipe.top, bottom: wipe.bottom, backgroundColor: "#000" }} />
          <div
            style={{
              position: "absolute", left: 0, right: 0, top: wipe.line - 7, height: 14,
              backgroundColor: "#b8ffc0", boxShadow: "0 0 24px 6px #6cff7a, 0 0 80px 20px rgba(108,255,122,0.5)",
            }}
          />
        </>
      )}
      {flash > 0 && <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flash * 0.85 }} />}
    </AbsoluteFill>
  );
};
