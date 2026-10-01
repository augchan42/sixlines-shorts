import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fonts } from "../lib/fonts";
import { IconClose, loadGoudy, OUT, Static } from "./Bookend";

// The Guide shorts' shared pieces (src/templates/Guide.tsx, the Wang Bi short, and the entries
// after it): the look of the 1981 BBC television Guide graphics, our own drawings and words. A
// short is a list of pages, one per narration line, and its sound cues; GuideShort plays them.

export type GuideWord = { text: string; from: number; to: number };
export type GuideProps = {
  frames: number;
  beats: { n: number; src: string; from: number; to: number; words: GuideWord[] }[];
  marks: Record<string, number>;
  close?: { tagline: string; site: string; sfx: string; sfxFrom: number; sfxVolume: number };
};
export type M = Record<string, number>;
export type Page = React.FC<{ f: number; m: M }>;

export const W = 1080;
export const H = 1920;
export const C = {
  yellow: "#ffe03a",
  pink: "#ff5fae",
  green: "#3fe46d",
  blue: "#3170ff",
  violet: "#8d4dff",
  red: "#ff2d2d",
  orange: "#ff8a1f",
  mint: "#9ff0d0",
  white: "#f4f6ff",
};
export const CYCLE = [C.yellow, C.pink, C.green, C.blue, C.violet, C.orange, C.red, C.mint];

export const sans = loadMontserrat("normal", { weights: ["700", "800"], subsets: ["latin"] }).fontFamily;

export const DRAW = 14; // frames an outline takes to draw on

export const glow = (c: string, r = 8) => `drop-shadow(0 0 ${r / 2}px ${c}) drop-shadow(0 0 ${r * 2}px ${c}99)`;
export const t01 = (f: number, a: number, d: number) => Math.min(1, Math.max(0, (f - a) / d));
export const eased = (f: number, a: number, b: number) => Easing.inOut(Easing.sin)(t01(f, a, b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Angular shapes, as the Guide's were ("more angular and with more lines", Rod Lord).
export type P = [number, number];
export const poly = (pts: P[]) => `M${pts.map((p) => p.join(" ")).join(" L")} Z`;
export const ngon = (cx: number, cy: number, r: number, n: number, rot = 0) =>
  poly(Array.from({ length: n }, (_, i) => [cx + r * Math.cos(rot + (i * 2 * Math.PI) / n), cy + r * Math.sin(rot + (i * 2 * Math.PI) / n)] as P));
export const moved = (pts: P[], x: number, y: number, s = 1): P[] => pts.map(([a, b]) => [x + a * s, y + b * s]);

// An outline that draws on from frame at.
export const Line: React.FC<{ d: string; c: string; f: number; at: number; w?: number; fill?: string; fillAt?: number; dur?: number }> = ({ d, c, f, at, w = 9, fill, fillAt, dur = DRAW }) =>
  f < at ? null : (
    <path
      d={d}
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - t01(f, at, dur)}
      stroke={c}
      strokeWidth={w}
      strokeLinejoin="round"
      strokeLinecap="round"
      fill={fill && fillAt !== undefined && f >= fillAt ? fill : "none"}
      style={{ filter: glow(c) }}
    />
  );

// A green label on a leader line, popping in at frame at: the line from (x1, y1) to the text at
// (x2, y2); "\n" breaks it onto a second line.
export const Label: React.FC<{ f: number; at: number; text: string; x1: number; y1: number; x2: number; y2: number; anchor?: "start" | "end" | "middle" }> = ({ f, at, text, x1, y1, x2, y2, anchor = "start" }) =>
  f < at ? null : (
    <g style={{ filter: glow(C.green, 5) }}>
      <line x1={x1} y1={y1} x2={x2} y2={y2 - 14} stroke={C.green} strokeWidth={3} strokeDasharray={1} strokeDashoffset={1 - t01(f, at, 5)} pathLength={1} />
      {f >= at + 4 && (
        <text x={x2} y={y2 + 22} textAnchor={anchor} fontFamily={sans} fontWeight={800} fontSize={38} letterSpacing={3} fill={C.green}>
          {text.split("\n").map((t, i) => <tspan key={i} x={x2} dy={i ? 46 : 0}>{t}</tspan>)}
        </text>
      )}
    </g>
  );

// Small print, for the freeze-frame reader.
export const Small: React.FC<{ f: number; at: number; x: number; y: number; text: string; anchor?: "start" | "end" | "middle" }> = ({ f, at, x, y, text, anchor = "start" }) =>
  f < at ? null : <text x={x} y={y} textAnchor={anchor} fontFamily={sans} fontWeight={700} fontSize={22} letterSpacing={2} fill={C.green} opacity={0.85}>{text}</text>;

// The page title, typed in at two frames a letter; an optional line under it.
export const Title: React.FC<{ f: number; at: number; text: string; zh?: string; sub?: string }> = ({ f, at, text, zh, sub }) => {
  const n = Math.max(0, Math.floor((f - at) / 2));
  // 100 px unless the title and its Chinese would run past the right edge (BEFORE COMPLETION 未濟):
  // about 0.68 em a letter with the spacing, 1 em a character.
  const size = Math.min(100, Math.floor(930 / (text.length * 0.68 + (zh ? zh.length + 0.3 : 0))));
  return (
    <>
      <div style={{ position: "absolute", left: 90, top: 120, color: C.blue, fontFamily: sans, fontWeight: 800, fontSize: size, letterSpacing: 4, filter: glow(C.blue, 10), whiteSpace: "nowrap" }}>
        {text.slice(0, n)}
        {zh && n > text.length && <span style={{ fontFamily: fonts.serif, fontWeight: 500, marginLeft: 28 }}>{zh}</span>}
      </div>
      {sub && n > text.length + 2 && (
        <div style={{ position: "absolute", left: 96, top: 250, color: C.green, fontFamily: sans, fontWeight: 800, fontSize: 44, letterSpacing: 4, filter: glow(C.green, 5) }}>{sub}</div>
      )}
    </>
  );
};

// The camera: scale about (ox, oy), then shift by (dx, dy), eased from a to b.
export type Cam = { s: number; dx?: number; dy?: number };
export const Camera: React.FC<{ f: number; a: number; b: number; from: Cam; to: Cam; ox: number; oy: number; children: React.ReactNode }> = ({ f, a, b, from, to, ox, oy, children }) => {
  const t = eased(f, a, b);
  const s = lerp(from.s, to.s, t), dx = lerp(from.dx ?? 0, to.dx ?? 0, t), dy = lerp(from.dy ?? 0, to.dy ?? 0, t);
  return <div style={{ position: "absolute", inset: 0, transformOrigin: `${ox}px ${oy}px`, transform: `translate(${dx}px, ${dy}px) scale(${s})` }}>{children}</div>;
};
export const Still: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ position: "absolute", inset: 0 }}>{children}</div>;
export const Pic: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>{children}</svg>;

// One hexagram, bottom line first, its bars filled.
export const Hexagram: React.FC<{ lines: number[]; x: number; y: number; w: number; c: string }> = ({ lines, x, y, w, c }) => {
  const bar = w * 0.11, gap = w * 0.07, h = 6 * bar + 5 * gap;
  return (
    <g style={{ filter: glow(c, 5) }}>
      {lines.map((l, i) => {
        const yy = y + h - bar - i * (bar + gap);
        return l ? <rect key={i} x={x} y={yy} width={w} height={bar} fill={c} /> : (
          <g key={i}>
            <rect x={x} y={yy} width={w * 0.42} height={bar} fill={c} />
            <rect x={x + w * 0.58} y={yy} width={w * 0.42} height={bar} fill={c} />
          </g>
        );
      })}
    </g>
  );
};

// The narration typed in blue capitals: each word's letters spread over the time it is spoken;
// the newest letter white. On the summary page the rows break before "Not" (or "Also"), a tick
// after the first row and a cross after a "Not" row (a tick after an "Also" row).
export type Ch = { ch: string; at: number; color?: string };
export const typedAt = (words: GuideWord[], summary = false) => {
  const out: Ch[] = [];
  const row2 = summary ? words.findIndex((w, i) => i > 0 && (w.text === "Not" || w.text === "Also")) : -1;
  const cross = row2 >= 0 && words[row2].text === "Not";
  words.forEach((w, i) => {
    if (i === row2) out.push({ ch: "\n", at: w.from });
    [...w.text.toUpperCase()].forEach((ch, k) => out.push({ ch, at: w.from + ((w.to - w.from) * k) / w.text.length }));
    const last = i === words.length - 1;
    if (row2 >= 0 && (i === row2 - 1 || last)) out.push({ ch: last && cross ? " ✗" : " ✓", at: w.to + 6, color: last && cross ? C.red : C.green });
    else if (!last) out.push({ ch: " ", at: w.to });
  });
  return out;
};
export const Typed: React.FC<{ f: number; words: GuideWord[]; summary: boolean }> = ({ f, words, summary }) => {
  const chars = typedAt(words, summary).filter((c) => c.at <= f);
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: summary ? 560 : 1340, fontFamily: sans, fontWeight: 700, fontSize: summary ? 62 : 52, lineHeight: 1.4, letterSpacing: 3, color: C.blue, filter: glow(C.blue, 6) }}>
      {chars.map((c, i) =>
        c.ch === "\n" ? <div key={i} style={{ height: 40 }} /> : (
          <span key={i} style={c.color ? { color: c.color, filter: glow(c.color, 6) } : i === chars.length - 1 && f - c.at < 4 ? { color: C.white } : undefined}>{c.ch}</span>
        ),
      )}
    </div>
  );
};


// A Guide short: its pages, one per line (keyed b1, b2 ... by the line they start on), the
// narration typed over them, hard cuts, a faint film flicker, dark corners, soft ticks under the
// typing, the ivory close; `cues` adds the short's own sounds. The summary page is the line
// numbered `summary`.
export const SFX = (name: string) => staticFile(`local/sfx/guide/${name}.wav`);
export const cue = (name: string, at: number, volume: number) => <Sequence key={`${name}${at}`} from={Math.round(at)} layout="none"><Audio src={SFX(name)} volume={volume} /></Sequence>;
export const GuideShort: React.FC<GuideProps & { pages: [string, Page][]; summary: number; cues: (m: M) => React.ReactNode }> = ({ beats, marks: m, close, pages, summary, cues }) => {
  loadGoudy();
  const f = useCurrentFrame();
  const current = [...beats].reverse().find((b) => f >= b.from) ?? beats[0];
  const Pg = [...pages].reverse().find(([k]) => m[k] !== undefined && f >= m[k])?.[1] ?? pages[0][1];
  const flicker = 1 + 0.025 * Math.sin(f * 2.3) * Math.sin(f * 0.7);
  const ticks = beats.flatMap((b) => typedAt(b.words).filter((c, i) => c.ch !== " " && i % 2 === 0).map((c) => Math.round(c.at)));
  const ivory = close && (f >= m.close + OUT.length || (f >= m.close && OUT[f - m.close]));
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <AbsoluteFill style={{ filter: `blur(0.8px) brightness(${flicker}) saturate(1.15)`, opacity: interpolate(f, [4, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <Pg f={f} m={m} />
        <Typed f={f} words={current.words} summary={current.n === summary} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)" }} />
      {ivory && close && <IconClose tagline={close.tagline} site={close.site} />}

      {beats.map((b) => (
        <Sequence key={b.n} from={b.from} layout="none"><Audio src={staticFile(b.src)} /></Sequence>
      ))}
      {ticks.map((t, i) => (
        <Sequence key={`t${i}`} from={t} durationInFrames={3} layout="none"><Audio src={SFX("tick-soft")} volume={0.08} /></Sequence>
      ))}
      {cue("boot-flutter", 2, 0.3)}
      {cues(m)}
      {close && <Static src={close.sfx} at={m.close} from={close.sfxFrom} volume={close.sfxVolume} />}
    </AbsoluteFill>
  );
};

// A hexagram drawn on bottom line first, a line every `step` frames: each bar's outline draws
// on, then fills. lines[0] is the bottom line, 1 solid, 0 broken.
export const DrawnHexagram: React.FC<{ f: number; at: number; lines: number[]; x: number; y: number; w: number; c: string; step?: number }> = ({ f, at, lines, x, y, w, c, step = 5 }) => {
  const bar = w * 0.11, gap = w * 0.07, h = 6 * bar + 5 * gap;
  const rect = (rx: number, ry: number, rw: number) => poly([[rx, ry], [rx + rw, ry], [rx + rw, ry + bar], [rx, ry + bar]]);
  return (
    <>
      {lines.map((l, i) => {
        const yy = y + h - bar - i * (bar + gap), a = at + i * step;
        return l ? <Line key={i} f={f} at={a} c={c} w={5} d={rect(x, yy, w)} fill={c} fillAt={a + 10} dur={10} /> : (
          <g key={i}>
            <Line f={f} at={a} c={c} w={5} d={rect(x, yy, w * 0.42)} fill={c} fillAt={a + 10} dur={10} />
            <Line f={f} at={a} c={c} w={5} d={rect(x + w * 0.58, yy, w * 0.42)} fill={c} fillAt={a + 10} dur={10} />
          </g>
        );
      })}
    </>
  );
};
// Where DrawnHexagram puts line i (0 the bottom): its top edge and height.
export const barY = (y: number, w: number, i: number) => y + 6 * w * 0.11 + 5 * w * 0.07 - w * 0.11 - i * (w * 0.18);
