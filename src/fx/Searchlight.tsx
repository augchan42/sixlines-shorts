import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// A searchlight sweeping over a lesson's picture, as in Blade Runner: a pool of light from
// above travels across the surface, lighting what it passes, with a hot spot and a horizontal
// lens streak where it hits. It replaces the beat punch (the user, 2026-09-26: "panning on the
// surface, and as it pans on the surface, you see glare"). The frame itself keeps still.
//
// The pool crosses once, top left to bottom right and back up a little, eased so it slows
// over the middle of the picture.
const PATH: [number, number][] = [
  [-0.15, 0.18],
  [0.45, 0.42],
  [1.15, 0.5],
];

export const Searchlight: React.FC<{ strength?: number }> = ({ strength = 1 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin), extrapolateRight: "clamp" });
  const along = (k: 0 | 1) => interpolate(t, [0, 0.5, 1], PATH.map((p) => p[k]));
  const x = along(0) * width;
  const y = along(1) * height;
  // Fades in and out, so the light never cuts on or off.
  const fade = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * strength;
  // The glare flickers a little, like a lamp through haze; slow, not on the beat.
  const glare = 0.85 + 0.15 * Math.sin(frame * 0.37) * Math.sin(frame * 0.11);
  const at = (w: number, h: number) => ({ position: "absolute" as const, left: x - w / 2, top: y - h / 2, width: w, height: h });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden", opacity: fade }}>
      {/* The pool: lights the picture under it, an ellipse since the beam meets the surface at a slant. */}
      <AbsoluteFill style={{ mixBlendMode: "soft-light", background: `radial-gradient(ellipse 520px 300px at ${x}px ${y}px, rgba(255,255,255,0.95), rgba(255,255,255,0.35) 55%, transparent 100%)` }} />
      <AbsoluteFill style={{ mixBlendMode: "screen", background: `radial-gradient(ellipse 520px 300px at ${x}px ${y}px, rgba(210,235,255,0.42), rgba(210,235,255,0.14) 50%, transparent 100%)` }} />
      {/* The beam through the haze above it, from a lamp off the top of the frame. */}
      {/* The blur sits on a wrapper: on the clipped element itself it would keep the hard edges. */}
      <AbsoluteFill style={{ mixBlendMode: "screen", filter: "blur(40px)" }}>
        <AbsoluteFill
          style={{
            background: "linear-gradient(180deg, rgba(200,225,255,0.12), rgba(200,225,255,0.05))",
            clipPath: `polygon(${width * 0.62 - 60}px -40px, ${width * 0.62 + 60}px -40px, ${x + 260}px ${y}px, ${x - 260}px ${y}px)`,
          }}
        />
      </AbsoluteFill>
      {/* The glare: a hot spot and a long horizontal streak across it. */}
      <div style={{ ...at(220, 150), mixBlendMode: "screen", borderRadius: "50%", filter: "blur(18px)", opacity: glare, background: "radial-gradient(ellipse, rgba(255,255,255,0.9), rgba(220,240,255,0.3) 45%, transparent 70%)" }} />
      <div style={{ ...at(width * 1.6, 10), mixBlendMode: "screen", filter: "blur(4px)", opacity: glare * 0.8, background: "linear-gradient(90deg, transparent, rgba(150,200,255,0.25) 30%, rgba(235,245,255,0.95) 50%, rgba(150,200,255,0.25) 70%, transparent)" }} />
      <div style={{ ...at(width * 0.9, 40), mixBlendMode: "screen", filter: "blur(14px)", opacity: glare * 0.5, background: "linear-gradient(90deg, transparent, rgba(150,200,255,0.3) 50%, transparent)" }} />
    </AbsoluteFill>
  );
};
