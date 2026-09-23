import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { beatFrame, jitter, useGrid } from "../lib/timing";

// A cut between two shots. Whips smear the frame sideways (or up) across the cut;
// a zoom pushes into the outgoing shot and lands the incoming one from zoomed in.
export type Cut = { beat: number; kind: "whip-left" | "whip-right" | "whip-up" | "zoom" };

// From `beat` until the next segment: how hard the frame punches on each beat,
// and how much it drifts like a handheld camera.
export type Motion = { beat: number; punch: number; sway: number };

// A burst of shake starting on `beat`, fading over `beats`.
export type Shake = { beat: number; strength: number; beats: number };

// Frames on each side of a cut that the transition occupies.
const HALF = 4;

const easeIn = (t: number) => t * t * t;

// Offset, scale and blur for a frame near a cut. `u` is frames from the cut; negative
// means the outgoing shot. Returns null outside the transition window.
const cutPose = (cut: Cut, u: number, width: number, height: number) => {
  if (u < -HALF || u >= HALF) return null;
  // 0 far from the cut, 1 on it.
  const p = easeIn(u < 0 ? (u + HALF) / HALF : 1 - u / HALF);
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
export const Camera: React.FC<{ cuts: Cut[]; motion: Motion[]; shakes: Shake[]; children: React.ReactNode }> = ({
  cuts,
  motion,
  shakes,
  children,
}) => {
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

  let blurX = 0;
  let blurY = 0;
  let bright = 1;
  for (const cut of cuts) {
    const pose = cutPose(cut, frame - at(cut.beat), width, height);
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
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
