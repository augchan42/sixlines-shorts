import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { glow } from "../fx/Glitch";
import { fonts } from "../lib/fonts";
import { jitter } from "../lib/timing";

const STARS = 600;

// A slow warp through a starfield, with the line flickering between caps and italic serif.
export const Reveal: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < STARS; i++) {
      const x = (random(`star-x-${i}`) - 0.5) * width * 2;
      const y = (random(`star-y-${i}`) - 0.5) * height * 2;
      // Depth cycles from far to near so the field never empties.
      const z = 1 - ((random(`star-z-${i}`) + frame * 0.004) % 1);
      const px = width / 2 + x / (z * 2 + 0.2);
      const py = height / 2 + y / (z * 2 + 0.2);
      const r = (1 - z) * 2.6 + 0.4;
      const warm = random(`star-c-${i}`) > 0.85;
      ctx.fillStyle = warm ? `rgba(255,220,150,${1 - z})` : `rgba(210,230,255,${1 - z})`;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [frame, width, height]);

  const typed = Math.ceil(interpolate(frame, [2, 14], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const serif = frame > 18 && jitter("reveal-font", frame, 4) > 0;
  const shown = text.slice(0, typed);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={canvas} width={width} height={height} style={{ width, height }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontFamily: serif ? fonts.serif : fonts.punch,
            fontStyle: serif ? "italic" : "normal",
            fontSize: serif ? 88 : 84,
            letterSpacing: serif ? 0 : 2,
            color: "#fff",
            textShadow: glow(),
            whiteSpace: "pre",
          }}
        >
          {serif ? shown : shown.toUpperCase()}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
