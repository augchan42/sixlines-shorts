import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { glow } from "../fx/Glitch";
import { fonts } from "../lib/fonts";

const GLYPHS = "01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ乾坤震巽坎離艮兌䷀䷁䷂䷃";
const CELL = 36;
const TRAIL = 18;

// Falling green glyphs, then a line of text typed over them.
export const CodeRain: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${CELL - 6}px monospace`;
    ctx.textAlign = "center";
    const cols = Math.ceil(width / CELL);
    const rows = Math.ceil(height / CELL);
    for (let c = 0; c < cols; c++) {
      const speed = 0.35 + random(`rain-speed-${c}`) * 0.6;
      const head = Math.floor(random(`rain-start-${c}`) * rows * 2 + frame * speed) % (rows + TRAIL * 2);
      for (let k = 0; k < TRAIL; k++) {
        const row = head - k;
        if (row < 0 || row >= rows) continue;
        const g = GLYPHS[Math.floor(random(`g-${c}-${row}-${Math.floor(frame / 3)}`) * GLYPHS.length)];
        ctx.fillStyle = k === 0 ? "rgba(220,255,225,1)" : `rgba(80,255,110,${(1 - k / TRAIL) * 0.85})`;
        ctx.fillText(g, c * CELL + CELL / 2, row * CELL + CELL);
      }
    }
  }, [frame, width, height]);

  const typed = Math.ceil(interpolate(frame, [4, 16], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={canvas} width={width} height={height} style={{ width, height, opacity: 0.8 }} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 70px" }}>
        <div
          style={{
            alignSelf: "flex-start",
            padding: "14px 28px",
            background: "rgba(0,0,0,0.6)",
            fontFamily: fonts.punch,
            fontSize: 110,
            letterSpacing: 2,
            color: "#fff",
            textShadow: glow(),
            whiteSpace: "pre",
          }}
        >
          {text.slice(0, typed)}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
