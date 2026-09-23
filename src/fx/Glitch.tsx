import { AbsoluteFill, useCurrentFrame } from "remotion";
import { jitter } from "../lib/timing";

// SVG filters that keep one colour channel. Rendered once at the root.
export const FxDefs: React.FC = () => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <defs>
      <filter id="only-r" colorInterpolationFilters="sRGB">
        <feColorMatrix values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
      <filter id="only-g" colorInterpolationFilters="sRGB">
        <feColorMatrix values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
      <filter id="only-b" colorInterpolationFilters="sRGB">
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
      </filter>
    </defs>
  </svg>
);

// Splits children into R, G and B copies and offsets them. Needs a black backdrop,
// because the copies are recombined with `screen`.
export const RGBSplit: React.FC<{ amount: number; seed: string; children: React.ReactNode }> = ({
  amount,
  seed,
  children,
}) => {
  const frame = useCurrentFrame();
  if (amount < 0.5) return <AbsoluteFill>{children}</AbsoluteFill>;
  const dx = amount * (0.6 + 0.4 * jitter(`${seed}-x`, frame));
  const dy = amount * 0.25 * jitter(`${seed}-y`, frame);
  const channels = [
    { id: "only-r", x: -dx, y: -dy },
    { id: "only-g", x: 0, y: 0 },
    { id: "only-b", x: dx, y: dy },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", isolation: "isolate" }}>
      {channels.map((c) => (
        <AbsoluteFill
          key={c.id}
          style={{ filter: `url(#${c.id})`, mixBlendMode: "screen", transform: `translate(${c.x}px, ${c.y}px)` }}
        >
          {children}
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};

// Cuts children into horizontal bands and shoves them sideways.
export const Slices: React.FC<{ amount: number; seed: string; bands?: number; children: React.ReactNode }> = ({
  amount,
  seed,
  bands = 9,
  children,
}) => {
  const frame = useCurrentFrame();
  if (amount < 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const edges = [0];
  for (let i = 1; i < bands; i++) edges.push(i / bands + jitter(`${seed}-e${i}`, frame, 3) * (0.4 / bands));
  edges.push(1);
  return (
    <AbsoluteFill>
      {edges.slice(0, -1).map((top, i) => {
        const bottom = edges[i + 1];
        const hit = jitter(`${seed}-h${i}`, frame, 2) > 0.2;
        const x = hit ? jitter(`${seed}-x${i}`, frame, 2) * amount : 0;
        return (
          <AbsoluteFill
            key={i}
            style={{
              clipPath: `inset(${top * 100}% 0 ${(1 - bottom) * 100}% 0)`,
              transform: `translateX(${x}px)`,
            }}
          >
            {children}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

// Film grain and scanlines over everything.
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.14 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ opacity, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 97} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill
        style={{
          background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 5px)",
          mixBlendMode: "multiply",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

// Text with a colour-fringed shadow, the way CapCut's "glitch" text presets look.
export const fringe = (px: number) =>
  `${-px}px 0 rgba(255,0,60,0.9), ${px}px 0 rgba(0,220,255,0.9), 0 0 ${px * 4}px rgba(255,255,255,0.35)`;

export const glow = (color = "255,255,255") =>
  `0 0 6px rgba(${color},0.95), 0 0 18px rgba(${color},0.7), 0 0 42px rgba(${color},0.45)`;
