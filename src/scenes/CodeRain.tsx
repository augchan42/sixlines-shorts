import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { glow, RGBSplit, Slices } from "../fx/Glitch";
import { ImageCanvas } from "../fx/ImageCanvas";
import { fonts } from "../lib/fonts";

const GLYPHS = "01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ乾坤震巽坎離艮兌䷀䷁䷂䷃";
const CELL = 36;
const TRAIL = 18;

// A plate that cuts in at `frame` (from the scene start) and holds until the next one.
export type PlateCut = { frame: number; src: string };

// Falling green glyphs, then a line of text typed over them. Each cut slams a full-bleed
// plate in behind the text, with the rain thinned over it. With `showText` off it is
// just the rain, as the backdrop for the Blender hexagram.
// `then` adds a second group under the first, typed on from its frame (a held meaning card).
export const CodeRain: React.FC<{ text: string; cuts?: PlateCut[]; showText?: boolean; then?: { frame: number; text: string } }> = ({
  text,
  cuts = [],
  showText = true,
  then,
}) => {
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

  const cut = [...cuts].reverse().find((c) => frame >= c.frame);
  const sinceCut = cut ? frame - cut.frame : 0;

  const typed = Math.ceil(interpolate(frame, [4, 16], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const more = then ? Math.ceil(interpolate(frame, [then.frame, then.frame + 12], [0, then.text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {cut && (
        <Slices amount={sinceCut < 2 ? 160 : 0} seed={`cut-${cut.frame}`}>
          <RGBSplit amount={sinceCut < 3 ? 24 : 4} seed={`cut-${cut.frame}`}>
            <ImageCanvas
              key={cut.src}
              src={cut.src}
              width={width}
              height={height}
              mode={sinceCut < 2 ? { kind: "pixel", block: 60 - sinceCut * 25 } : { kind: "plain" }}
              zoom={1.1 + 0.25 * Math.exp(-sinceCut / 3)}
            />
          </RGBSplit>
        </Slices>
      )}
      <canvas
        ref={canvas}
        width={width}
        height={height}
        style={{ position: "absolute", width, height, opacity: cut ? 0.3 : 0.8, mixBlendMode: cut ? "screen" : "normal" }}
      />
      {showText && <TypedBox text={`${text.slice(0, typed)}${then && more > 0 ? `\n\n${then.text.slice(0, more)}` : ""}`} />}
    </AbsoluteFill>
  );
};

const TypedBox: React.FC<{ text: string }> = ({ text }) => (
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
      {text}
    </div>
  </AbsoluteFill>
);

// The same sentence box, typed on over whatever is behind it (a moon lesson's clip).
export const TypedText: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const typed = Math.ceil(interpolate(frame, [4, 16], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return <TypedBox text={text.slice(0, typed)} />;
};
