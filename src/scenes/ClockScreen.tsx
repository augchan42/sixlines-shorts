import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { RGBSplit } from "../fx/Glitch";
import { ImageCanvas } from "../fx/ImageCanvas";
import { fonts } from "../lib/fonts";

const NUMERALS = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

// An app screen held inside a turning clock face, over a dim halftone plate.
export const ClockScreen: React.FC<{ src: string; backdrop: string }> = ({ src, backdrop }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const slam = spring({ frame, fps, config: { damping: 12, stiffness: 170 } });
  const ring = 980;
  return (
    <RGBSplit amount={frame < 3 ? 16 : 3} seed="clock">
      <AbsoluteFill style={{ opacity: 0.3 }}>
        <ImageCanvas src={backdrop} width={width} height={height} mode={{ kind: "halftone", cell: 12 }} zoom={1.2} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <svg
          width={ring}
          height={ring}
          viewBox="-500 -500 1000 1000"
          style={{
            position: "absolute",
            transform: `rotate(${frame * 1.2}deg) scale(${interpolate(slam, [0, 1], [1.6, 1])})`,
            filter: "drop-shadow(0 0 18px rgba(255,255,255,0.45))",
          }}
        >
          <circle r={470} fill="none" stroke="#e8e8e8" strokeWidth={6} />
          <circle r={440} fill="none" stroke="#e8e8e8" strokeWidth={2} />
          {Array.from({ length: 60 }, (_, i) => (
            <line
              key={i}
              x1={0}
              y1={-440}
              x2={0}
              y2={i % 5 === 0 ? -412 : -428}
              stroke="#e8e8e8"
              strokeWidth={i % 5 === 0 ? 5 : 2}
              transform={`rotate(${i * 6})`}
            />
          ))}
          {NUMERALS.map((n, i) => (
            <text
              key={n}
              transform={`rotate(${i * 30}) translate(0 -360) rotate(${-i * 30})`}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#f4f4f4"
              fontFamily={fonts.serif}
              fontSize={58}
            >
              {n}
            </text>
          ))}
        </svg>
        <Img
          src={staticFile(src)}
          style={{
            width: 470,
            borderRadius: 56,
            border: "8px solid #111",
            boxShadow: "0 30px 90px rgba(0,0,0,0.85)",
            transform: `rotate(${interpolate(slam, [0, 1], [-14, -4])}deg) scale(${interpolate(slam, [0, 1], [0.6, 1])})`,
          }}
        />
      </AbsoluteFill>
    </RGBSplit>
  );
};
