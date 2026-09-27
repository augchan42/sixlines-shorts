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

export const PHOSPHOR = "#7dff8a";
export const DIM = "rgba(125,255,138,0.45)";
export const glow = `0 0 10px ${PHOSPHOR}, 0 0 22px rgba(125,255,138,0.5)`;

// What each trigram does, from the Shuo Gua (Discussion of the Trigrams), chapter 7.
export const DOES: Record<string, string> = {
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
export const LINE_W = 6.2;
export const LINE_H = 0.5;
const GAP = 0.3;
const TRIGRAM_GAP = 0.9;
const YIN_GAP = 0.7;
export const DEPTH = 0.45;
export const lineZ = (i: number) => {
  const total = 6 * LINE_H + 4 * GAP + TRIGRAM_GAP;
  return -total / 2 + LINE_H / 2 + i * (LINE_H + GAP) + (i >= 3 ? TRIGRAM_GAP - GAP : 0);
};
export const slabsOf = (lines: (0 | 1)[]) =>
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
export const boxEdges = (x0: number, x1: number, z: number, turn: number, scale: number, cx: number, cy: number) => {
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

export const Line: React.FC<{ text: string; frame: number; at: number; rate?: number; size?: number; color?: string; cursor?: boolean; glowless?: boolean; style?: React.CSSProperties }> = ({
  text,
  frame,
  at,
  rate,
  size = 44,
  color = PHOSPHOR,
  cursor,
  glowless,
  style,
}) => {
  const t = typed(text, frame, at, rate);
  if (!t.started && !cursor) return <div style={{ height: size * 1.25, ...style }} />;
  const blink = Math.floor(frame / 8) % 2 === 0;
  return (
    <div style={{ fontFamily: fonts.pixel, fontSize: size, lineHeight: 1.25, color, textShadow: glowless ? "none" : glow, whiteSpace: "pre-wrap", ...style }}>
      {t.shown}
      {(t.typing || (cursor && blink)) && <span style={{ backgroundColor: color, color: "transparent" }}>█</span>}
    </div>
  );
};

// One log row in fixed columns: L1, the line drawn as a bar (one for yang, two halves for
// yin, the same overall length), YANG/YIN, IN/OUT, · CENTRE and ◄. The pixel font has no box
// glyphs, and its letters differ in width, so each column has its own width. `shown` counts the
// characters typed so far (the row types in as a string of the same length would); `style`
// gives each part's colour and strength (keys: bar, yy, place, centre, mark).
type PartStyle = { color: string; opacity?: number; glow?: boolean };
const ROW = { label: 2.1, bar: 5.4, gap: 0.9, yy: 3.6, place: 2.9 };
export const LogRowView: React.FC<{
  i: number;
  yang: boolean;
  place: string;
  centre: boolean;
  mark: boolean;
  size: number;
  shown?: number;
  style: (part: "bar" | "yy" | "place" | "centre" | "mark") => PartStyle;
  cursor?: boolean;
}> = ({ i, yang, place, centre, mark, size, shown = Infinity, style, cursor }) => {
  const label = `L${i + 1}`;
  const word = yang ? "YANG" : "YIN";
  // Characters each column takes to type, as in the old one-string row.
  const counts = [label.length + 2, 9, word.length + 2, place ? place.length + 2 : 0, centre ? 9 : 0, mark ? 3 : 0];
  const starts = counts.map((_, k) => counts.slice(0, k).reduce((a, b) => a + b, 0));
  const typed = (k: number, text: string) => text.slice(0, Math.max(0, Math.min(text.length, shown - starts[k])));
  const css = (p: PartStyle): React.CSSProperties => ({ color: p.color, opacity: p.opacity ?? 1, textShadow: p.glow === false ? "none" : glow });
  const bar = style("bar");
  const barDone = Math.max(0, Math.min(1, (shown - starts[1]) / 9));
  const w = ROW.bar * size;
  const h = size * 0.3;
  const half = (w - ROW.gap * size) / 2;
  const box = (left: number, width: number) => (
    <div style={{ position: "absolute", left, top: (size * 1.25 - h) / 2, width: Math.max(0, width), height: h, backgroundColor: bar.color, boxShadow: bar.glow === false ? "none" : `0 0 8px ${bar.color}` }} />
  );
  const cell = (width: number, children: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{ position: "relative", display: "inline-block", width: width * size, height: size * 1.25, verticalAlign: "top", ...extra }}>{children}</div>
  );
  const done = shown >= counts.reduce((a, b) => a + b, 0);
  return (
    <div style={{ fontFamily: fonts.pixel, fontSize: size, lineHeight: 1.25, whiteSpace: "pre", height: size * 1.25 }}>
      {cell(ROW.label, typed(0, label), css(bar))}
      {cell(ROW.bar + 0.8, <div style={{ opacity: bar.opacity ?? 1 }}>{yang ? box(0, w * barDone) : <>{box(0, Math.min(half, w * barDone))}{barDone * w > half + ROW.gap * size && box(half + ROW.gap * size, w * barDone - half - ROW.gap * size)}</>}</div>)}
      {cell(ROW.yy, typed(2, word), css(style("yy")))}
      {place ? cell(ROW.place, typed(3, place), css(style("place"))) : null}
      {centre ? <span style={css(style("centre"))}>{typed(4, "· CENTRE")}</span> : null}
      {mark ? <span style={css(style("mark"))}>{typed(5, "  ◄")}</span> : null}
      {cursor && !done && shown > 0 && <span style={{ backgroundColor: bar.color, color: "transparent" }}>█</span>}
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
  // Wang Bi's words naming the marked line the hexagram's master (series/wangbi.json).
  master?: { zh: string; en: string };
  // For the explainer (src/templates/ReadoutKey.tsx): the whole screen drawn from the first
  // frame; `focus` names the parts at full strength, the rest dimmed (keys in `lit` below);
  // `marked` turns the ◄ lines amber; `prompt` is typed in white in place of the lesson.
  built?: boolean;
  focus?: string[];
  marked?: boolean;
  prompt?: { text: string; at: number };
}> = ({ number, name, lines, trigrams: [upper, lower], text, mark = [], finding, master, built, focus, marked, prompt }) => {
  const now = useCurrentFrame();
  // Built: every act has already happened, so the frame the acts see is far past the end.
  const frame = built ? now + 100000 : now;
  // header, plot:i, row:i (the whole log row), yy:i, place:i, centre:i, link, upper, lower,
  // bracket:upper, bracket:lower, master, finding. Without `focus` everything is lit.
  const lit = (...keys: string[]) => !focus || keys.some((k) => focus.includes(k));
  const dim = (...keys: string[]) => (lit(...keys) ? 1 : 0.22);
  const { width, height, durationInFrames: d } = useVideoConfig();
  // The acts, as shares of the lesson: header, plot, the answering lines, trigrams, Wang
  // Bi's master, the finding, then the answer.
  const at = (share: number) => Math.round(share * d);
  const plotFrom = at(0.04);
  const plotEach = (at(master ? 0.26 : 0.3) - plotFrom) / 6;
  const linksAt = at(master ? 0.27 : 0.31);
  const trigramsAt = at(master ? 0.33 : 0.32);
  const masterAt = at(0.42);
  const findingAt = master ? at(0.5) : at(0.42);
  const markAt = master ? masterAt : findingAt;
  const answerAt = master ? (finding ? at(0.58) : at(0.52)) : finding ? at(0.5) : at(0.44);
  // Wang Bi's reading of each line: in its place (yang in the odd places 3 and 5, yin in the
  // even ones 2 and 4) or out of it, and the centres of the two trigrams (2 and 5). Lines 1
  // and 6 have no place: they are the start and end of the matter (Zhouyi lüeli, 辯位).
  const place = (i: number) => (i === 0 || i === 5 ? "" : (lines[i] === (i % 2 === 0 ? 1 : 0) ? "IN " : "OUT") + (i === 1 || i === 4 ? " · CENTRE" : ""));
  // 1 answers 4, 2 answers 5, 3 answers 6, when one is yin and the other yang.
  const answering = [0, 1, 2].filter((i) => lines[i] !== lines[i + 3]);

  const turn = interpolate(now, [0, d], [-0.55, 0.35]);
  const cx = width / 2;
  const cy = 670;
  const scale = 100;
  const flicker = 0.94 + 0.06 * random(`flicker-${Math.floor(now / 2)}`);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity: flicker }}>
      {/* The message area's frame and its running counters, as on the Nostromo's orbit display. */}
      <div style={{ position: "absolute", inset: "150px 50px 200px", border: `3px solid ${DIM}`, boxShadow: `inset 0 0 40px rgba(125,255,138,0.08)` }} />
      <div style={{ position: "absolute", left: 50, right: 50, top: 150, height: 90, borderBottom: `3px solid ${DIM}` }} />
      <div style={{ position: "absolute", left: 80, top: 168, opacity: dim("header") }}>
        <Line text={`SIX LINES // QUERY ${pad(number)}`} frame={frame} at={0} rate={0.8} size={46} />
      </div>
      <div style={{ position: "absolute", right: 80, top: 176, fontFamily: fonts.pixel, fontSize: 34, color: DIM, opacity: dim("header") }}>
        {`SYS ${(76.75 + ((now * 7.31) % 23)).toFixed(2)}`}
      </div>
      {/* A column of changing figures down the left edge. */}
      <div style={{ position: "absolute", left: 76, top: 300, fontFamily: fonts.pixel, fontSize: 26, lineHeight: 1.6, color: DIM, opacity: focus ? 0.22 : 1 }}>
        {Array.from({ length: 12 }, (_, k) => (
          <div key={k}>{Math.floor(random(`col-${k}-${Math.floor(now / 3)}`) * 9000 + 1000)}</div>
        ))}
      </div>

      {/* The plot: the hexagram as a turning wireframe, drawn bottom line first. */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <g fill="none" stroke={PHOSPHOR} strokeWidth={2.6} style={{ filter: `drop-shadow(0 0 6px ${PHOSPHOR})` }}>
          {slabsOf(lines).map((s, k) => {
            const drawn = interpolate(frame, [plotFrom + s.i * plotEach, plotFrom + (s.i + 0.8) * plotEach], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            if (drawn <= 0) return null;
            const amber = mark.includes(s.i) && (focus ? !!marked : frame >= markAt);
            const on = !amber || Math.floor((frame - markAt) / 6) % 2 === 0;
            return (
              <path
                key={k}
                d={boxEdges(s.x0, s.x1, s.z, turn, scale, cx, cy)}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - drawn}
                stroke={amber ? "#ffb347" : PHOSPHOR}
                opacity={(on ? 1 : 0.35) * dim(`plot:${s.i}`)}
              />
            );
          })}
        </g>
        {/* The answering lines, linked down the left of the plot. */}
        {answering.map((i, k) => {
          const drawn = interpolate(frame, [linksAt + k * 5, linksAt + k * 5 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          if (drawn <= 0) return null;
          const x = cx - (LINE_W / 2) * scale - 40 - k * 24;
          const [ya, yb] = [cy - lineZ(i) * scale, cy - lineZ(i + 3) * scale];
          return <path key={i} opacity={dim("link")} d={`M${x + 20},${ya}H${x}V${yb}H${x + 20}`} fill="none" stroke={PHOSPHOR} strokeWidth={3.4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawn} style={{ filter: `drop-shadow(0 0 6px ${PHOSPHOR})` }} />;
        })}
        {/* Brackets round the two trigrams, once they are named. */}
        {frame >= trigramsAt &&
          [3, 0].map((from) => {
            const top = cy - lineZ(from + 2) * scale - LINE_H * scale;
            const bottom = cy - lineZ(from) * scale + LINE_H * scale;
            const x = cx + (LINE_W / 2) * scale + 70;
            return <path key={from} opacity={dim(from ? "bracket:upper" : "bracket:lower")} d={`M${x - 24},${top}H${x}V${bottom}H${x - 24}`} fill="none" stroke={DIM} strokeWidth={3} />;
          })}
      </svg>

      {/* The log: one entry per line as it is plotted, top to bottom on screen. */}
      <div style={{ position: "absolute", left: 80, top: 1070, right: 80 }}>
        {[5, 4, 3, 2, 1, 0].map((i) => focus ? (
          <div key={i} style={{ position: "absolute", top: (5 - i) * 44 }}>
            <LogRowView
              i={i}
              yang={lines[i] === 1}
              place={place(i).split(" · ")[0].trim()}
              centre={i === 1 || i === 4}
              mark={mark.includes(i) && !!marked}
              size={34}
              style={(part) => {
                const key = { bar: `plot:${i}`, yy: `yy:${i}`, place: `place:${i}`, centre: `centre:${i}`, mark: "mark" }[part];
                const on = dim(`row:${i}`, key) === 1;
                const amber = mark.includes(i) && !!marked;
                return { color: amber ? "#ffb347" : on ? PHOSPHOR : DIM, opacity: on ? 1 : 0.35, glow: on };
              }}
            />
          </div>
        ) : (
          <div key={i} style={{ position: "absolute", top: (5 - i) * 44 }}>
            <LogRowView
              i={i}
              yang={lines[i] === 1}
              place={place(i).split(" · ")[0].trim()}
              centre={i === 1 || i === 4}
              mark={mark.includes(i) && frame >= markAt}
              size={34}
              shown={Math.floor((frame - (plotFrom + i * plotEach)) / 0.6)}
              cursor
              style={() => ({ color: mark.includes(i) && frame >= markAt ? "#ffb347" : DIM })}
            />
          </div>
        ))}
      </div>

      {/* The two trigrams, named beside the plot. */}
      <div style={{ position: "absolute", left: 170, right: 80, top: 0 }}>
        {frame >= trigramsAt && (
          <>
            <Line text={`UPPER ${upper.zh} ${upper.name} · ${DOES[upper.name]}`} frame={frame} at={trigramsAt} size={42} style={{ position: "absolute", top: 272, opacity: dim("upper") }} />
            <Line text={`LOWER ${lower.zh} ${lower.name} · ${DOES[lower.name]}`} frame={frame} at={trigramsAt + 14} size={42} style={{ position: "absolute", top: 985, opacity: dim("lower") }} />
          </>
        )}
      </div>

      {/* The finding and the answer at the prompt. */}
      <div style={{ position: "absolute", left: 80, right: 80, top: 1360 }}>
        {master && (
          <>
            <Line text={`> WANG BI: ${master.zh}`} frame={frame} at={masterAt} size={38} color="#ffb347" style={{ opacity: dim("master") }} />
            <Line text={`  ${master.en.toUpperCase()}`} frame={frame} at={masterAt + 12} size={34} color="#ffb347" style={{ opacity: dim("master") }} />
          </>
        )}
        {finding && <Line text={`> ${finding}`} frame={frame} at={findingAt} size={38} color={master ? DIM : "#ffb347"} style={{ opacity: dim("finding") }} />}
        {!master && <Line text={`> ${name.toUpperCase()}:`} frame={frame} at={answerAt} size={38} color={DIM} style={{ opacity: dim("finding") }} />}
        {prompt ? (
          <Line text={prompt.text} frame={now} at={prompt.at} rate={1.2} size={64} color="#fff" cursor glowless />
        ) : (
          <Line text={text.toUpperCase()} frame={frame} at={answerAt + 10} rate={1.2} size={64} cursor={frame >= answerAt + 10} />
        )}
      </div>

      {/* Scanlines and the tube's dark corners. */}
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 5px)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
