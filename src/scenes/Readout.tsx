import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts } from "../lib/fonts";

// A lesson as a ship's computer readout, after the Nostromo's screens in Alien (Brian
// Wyvill's vector plots, the MU/TH/UR terminal): green phosphor on black, scanlines, a
// framed message area, a slowly turning wireframe of the hexagram plotted line by line,
// each line logged, the two trigrams named with what they do, the line that matters
// marked, and the lesson's sentence typed at the prompt as the computer's answer. The user,
// 2026-09-26: "Nostromo UI … some kind of computer readout".
//
// The frame keeps still; only the plot turns, once, slowly.

const PHOSPHOR = "#7dff8a";
const DIM = "rgba(125,255,138,0.45)";
const glow = `0 0 10px ${PHOSPHOR}, 0 0 22px rgba(125,255,138,0.5)`;

// What each trigram does, from the Shuo Gua (Discussion of the Trigrams), chapter 7.
const DOES: Record<string, string> = {
  HEAVEN: "STRONG",
  EARTH: "YIELDING",
  THUNDER: "MOVING",
  WATER: "SINKING",
  MOUNTAIN: "STILL",
  WIND: "ENTERING",
  FIRE: "CLINGING",
  LAKE: "JOYFUL",
};

export type Trigram = { zh: string; name: string };

// Layout of the lines in plot units: as blender/layout.py (a line 6.2 wide, 0.5 tall).
const LINE_W = 6.2;
const LINE_H = 0.5;
const GAP = 0.3;
const TRIGRAM_GAP = 0.9;
const YIN_GAP = 0.7;
const DEPTH = 0.45;
const lineZ = (i: number) => {
  const total = 6 * LINE_H + 4 * GAP + TRIGRAM_GAP;
  return -total / 2 + LINE_H / 2 + i * (LINE_H + GAP) + (i >= 3 ? TRIGRAM_GAP - GAP : 0);
};
const slabsOf = (lines: (0 | 1)[]) =>
  lines.flatMap((yang, i) => {
    const z = lineZ(i);
    if (yang) return [{ i, x0: -LINE_W / 2, x1: LINE_W / 2, z }];
    const w = (LINE_W - YIN_GAP) / 2;
    return [
      { i, x0: -LINE_W / 2, x1: -LINE_W / 2 + w, z },
      { i, x0: LINE_W / 2 - w, x1: LINE_W / 2, z },
    ];
  });

// A box's 12 edges, projected from a camera `dist` away, turned `turn` radians about the vertical.
const boxEdges = (x0: number, x1: number, z: number, turn: number, scale: number, cx: number, cy: number) => {
  const dist = 16;
  const corners = [x0, x1].flatMap((x) => [-DEPTH / 2, DEPTH / 2].flatMap((y) => [z - LINE_H / 2, z + LINE_H / 2].map((zz) => [x, y, zz])));
  const p = corners.map(([x, y, zz]) => {
    const rx = x * Math.cos(turn) - y * Math.sin(turn);
    const ry = x * Math.sin(turn) + y * Math.cos(turn);
    const k = dist / (dist + ry);
    return [cx + rx * k * scale, cy - zz * k * scale];
  });
  const pairs = [
    [0, 1], [2, 3], [4, 5], [6, 7],
    [0, 2], [1, 3], [4, 6], [5, 7],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  return pairs.map(([a, b]) => `M${p[a][0].toFixed(1)},${p[a][1].toFixed(1)}L${p[b][0].toFixed(1)},${p[b][1].toFixed(1)}`).join("");
};

// Typed text: `chars` characters shown by frame `at`, one every `rate` frames, with a block cursor while typing.
const typed = (text: string, frame: number, at: number, rate = 1.2) => {
  const n = Math.max(0, Math.floor((frame - at) / rate));
  return { shown: text.slice(0, n), typing: n > 0 && n < text.length, started: n > 0 };
};

const Line: React.FC<{ text: string; frame: number; at: number; rate?: number; size?: number; color?: string; cursor?: boolean; style?: React.CSSProperties }> = ({
  text,
  frame,
  at,
  rate,
  size = 44,
  color = PHOSPHOR,
  cursor,
  style,
}) => {
  const t = typed(text, frame, at, rate);
  if (!t.started && !cursor) return <div style={{ height: size * 1.25, ...style }} />;
  const blink = Math.floor(frame / 8) % 2 === 0;
  return (
    <div style={{ fontFamily: fonts.pixel, fontSize: size, lineHeight: 1.25, color, textShadow: glow, whiteSpace: "pre-wrap", ...style }}>
      {t.shown}
      {(t.typing || (cursor && blink)) && <span style={{ backgroundColor: color, color: "transparent" }}>█</span>}
    </div>
  );
};

export const Readout: React.FC<{
  number: number;
  name: string;
  lines: (0 | 1)[];
  trigrams: [Trigram, Trigram]; // upper, lower
  text: string;
  // Line indices (0 = bottom) to mark, and what the computer says about them.
  mark?: number[];
  finding?: string;
}> = ({ number, name, lines, trigrams: [upper, lower], text, mark = [], finding }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames: d } = useVideoConfig();
  // The acts, as shares of the lesson: header, plot, trigrams, finding, then the answer.
  const at = (share: number) => Math.round(share * d);
  const plotFrom = at(0.05);
  const plotEach = (at(0.3) - plotFrom) / 6;
  const trigramsAt = at(0.32);
  const findingAt = at(0.42);
  const answerAt = finding ? at(0.5) : at(0.44);

  const turn = interpolate(frame, [0, d], [-0.55, 0.35]);
  const cx = width / 2;
  const cy = 670;
  const scale = 100;
  const flicker = 0.94 + 0.06 * random(`flicker-${Math.floor(frame / 2)}`);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity: flicker }}>
      {/* The message area's frame and its running counters, as on the Nostromo's orbit display. */}
      <div style={{ position: "absolute", inset: "150px 50px 200px", border: `3px solid ${DIM}`, boxShadow: `inset 0 0 40px rgba(125,255,138,0.08)` }} />
      <div style={{ position: "absolute", left: 50, right: 50, top: 150, height: 90, borderBottom: `3px solid ${DIM}` }} />
      <div style={{ position: "absolute", left: 80, top: 168 }}>
        <Line text={`SIX LINES // QUERY ${pad(number)}`} frame={frame} at={0} rate={0.8} size={46} />
      </div>
      <div style={{ position: "absolute", right: 80, top: 176, fontFamily: fonts.pixel, fontSize: 34, color: DIM }}>
        {`SYS ${(76.75 + ((frame * 7.31) % 23)).toFixed(2)}`}
      </div>
      {/* A column of changing figures down the left edge. */}
      <div style={{ position: "absolute", left: 76, top: 300, fontFamily: fonts.pixel, fontSize: 26, lineHeight: 1.6, color: DIM }}>
        {Array.from({ length: 12 }, (_, k) => (
          <div key={k}>{Math.floor(random(`col-${k}-${Math.floor(frame / 3)}`) * 9000 + 1000)}</div>
        ))}
      </div>

      {/* The plot: the hexagram as a turning wireframe, drawn bottom line first. */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <g fill="none" stroke={PHOSPHOR} strokeWidth={2.6} style={{ filter: `drop-shadow(0 0 6px ${PHOSPHOR})` }}>
          {slabsOf(lines).map((s, k) => {
            const drawn = interpolate(frame, [plotFrom + s.i * plotEach, plotFrom + (s.i + 0.8) * plotEach], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            if (drawn <= 0) return null;
            const marked = mark.includes(s.i) && frame >= findingAt;
            const on = !marked || Math.floor((frame - findingAt) / 6) % 2 === 0;
            return (
              <path
                key={k}
                d={boxEdges(s.x0, s.x1, s.z, turn, scale, cx, cy)}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - drawn}
                stroke={marked ? "#ffb347" : PHOSPHOR}
                opacity={on ? 1 : 0.35}
              />
            );
          })}
        </g>
        {/* Brackets round the two trigrams, once they are named. */}
        {frame >= trigramsAt &&
          [3, 0].map((from) => {
            const top = cy - lineZ(from + 2) * scale - LINE_H * scale;
            const bottom = cy - lineZ(from) * scale + LINE_H * scale;
            const x = cx + (LINE_W / 2) * scale + 70;
            return <path key={from} d={`M${x - 24},${top}H${x}V${bottom}H${x - 24}`} fill="none" stroke={DIM} strokeWidth={3} />;
          })}
      </svg>

      {/* The log: one entry per line as it is plotted, top to bottom on screen. */}
      <div style={{ position: "absolute", left: 80, top: 1070, right: 80 }}>
        {[5, 4, 3, 2, 1, 0].map((i) => (
          <Line
            key={i}
            text={`L${i + 1}  ${lines[i] ? "━━━━━━━  YANG" : "━━━   ━━━  YIN"}${mark.includes(i) && frame >= findingAt ? "  ◄" : ""}`}
            frame={frame}
            at={plotFrom + i * plotEach}
            rate={0.6}
            size={34}
            color={mark.includes(i) && frame >= findingAt ? "#ffb347" : DIM}
            style={{ position: "absolute", top: (5 - i) * 44 }}
          />
        ))}
      </div>

      {/* The two trigrams, named beside the plot. */}
      <div style={{ position: "absolute", left: 170, right: 80, top: 0 }}>
        {frame >= trigramsAt && (
          <>
            <Line text={`UPPER ${upper.zh} ${upper.name} · ${DOES[upper.name]}`} frame={frame} at={trigramsAt} size={42} style={{ position: "absolute", top: 272 }} />
            <Line text={`LOWER ${lower.zh} ${lower.name} · ${DOES[lower.name]}`} frame={frame} at={trigramsAt + 14} size={42} style={{ position: "absolute", top: 985 }} />
          </>
        )}
      </div>

      {/* The finding and the answer at the prompt. */}
      <div style={{ position: "absolute", left: 80, right: 80, top: 1360 }}>
        {finding && <Line text={`> ${finding}`} frame={frame} at={findingAt} size={38} color="#ffb347" />}
        <Line text={`> ${name.toUpperCase()}:`} frame={frame} at={answerAt} size={38} color={DIM} />
        <Line text={text.toUpperCase()} frame={frame} at={answerAt + 10} rate={1.2} size={64} cursor={frame >= answerAt + 10} />
      </div>

      {/* Scanlines and the tube's dark corners. */}
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 5px)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
