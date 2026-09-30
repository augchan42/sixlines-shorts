import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import table from "../../series/hexagrams.json";
import { fonts } from "../lib/fonts";

// A Guide-style short (the user, 2026-09-30: "a Wang Bi 'hitchhikers guide to the universe' style
// short"), in the manner of the 1981 BBC television Guide graphics the user sent as reference
// ("the style is funny but not retro enough"): full-screen black; thick neon outlines that draw on,
// then flat fills; small green labels on leader lines; a blue title top left; the narration typed
// along the bottom in blue capitals, the newest letter white; a soft, glowing film look. Our own
// drawings and words. The narration and picture notes are in series/specials/guide-wangbi.json;
// scripts/guide-props.mjs writes the props. This cut draws lines 1-3. The first, flat-device cut
// is in git at 46c8d1f.

export type GuideWord = { text: string; from: number; to: number };
export type GuideProps = {
  frames: number;
  beats: { n: number; src: string; from: number; to: number; words: GuideWord[] }[];
  marks: Record<string, number>;
};

const W = 1080;
const H = 1920;
const C = {
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
const CYCLE = [C.yellow, C.pink, C.green, C.blue, C.violet, C.orange, C.red, C.mint];

const sans = loadMontserrat("normal", { weights: ["700", "800"], subsets: ["latin"] }).fontFamily;

const SFX = (name: string) => staticFile(`local/sfx/guide/${name}.wav`);
const DRAW = 14; // frames an outline takes to draw on

const glow = (c: string, r = 8) => `drop-shadow(0 0 ${r / 2}px ${c}) drop-shadow(0 0 ${r * 2}px ${c}99)`;
const t01 = (f: number, a: number, d: number) => Math.min(1, Math.max(0, (f - a) / d));

// An outline that draws on from frame at.
const Line: React.FC<{ d: string; c: string; f: number; at: number; w?: number; fill?: string; fillAt?: number }> = ({ d, c, f, at, w = 9, fill, fillAt }) => (
  <path
    d={d}
    pathLength={1}
    strokeDasharray={1}
    strokeDashoffset={1 - t01(f, at, DRAW)}
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
const Label: React.FC<{ f: number; at: number; text: string; x1: number; y1: number; x2: number; y2: number; anchor?: "start" | "end" | "middle" }> = ({ f, at, text, x1, y1, x2, y2, anchor = "start" }) =>
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

// The page title, typed in at two frames a letter.
const Title: React.FC<{ f: number; at: number; text: string; zh?: string }> = ({ f, at, text, zh }) => {
  const n = Math.max(0, Math.floor((f - at) / 2));
  return (
    <div style={{ position: "absolute", left: 90, top: 120, color: C.blue, fontFamily: sans, fontWeight: 800, fontSize: 100, letterSpacing: 4, filter: glow(C.blue, 10), whiteSpace: "nowrap" }}>
      {text.slice(0, n)}
      {zh && n > text.length && <span style={{ fontFamily: fonts.serif, fontWeight: 500, marginLeft: 28 }}>{zh}</span>}
    </div>
  );
};

// One hexagram, bottom line first, its bars filled.
const Hexagram: React.FC<{ lines: number[]; x: number; y: number; w: number; c: string }> = ({ lines, x, y, w, c }) => {
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

// Line 1: the 64, one after another, each flashing white as it lands; the age on a label.
const Book: React.FC<{ f: number; m: Record<string, number> }> = ({ f, m }) => (
  <>
    <Title f={f} at={m.b1} text="THE I-CHING" />
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {(table as { lines: number[] }[]).map((h, i) => {
        const at = m.grid + i * 0.6;
        if (f < at) return null;
        const row = Math.floor(i / 8), col = i % 8;
        return <Hexagram key={i} lines={h.lines} x={100 + col * 115} y={340 + row * 105} w={76} c={f < at + 2 ? C.white : CYCLE[(row + col) % CYCLE.length]} />;
      })}
      <Label f={f} at={m.years} text="ROOTS: ABOUT 3,000 YEARS" x1={540} y1={1195} x2={540} y2={1235} anchor="middle" />
    </svg>
  </>
);

// Line 2: someone sorts and counts yarrow stalks into piles; a question mark.
const STALK_MOVES = 10;
const moveAt = (m: Record<string, number>, k: number) => m.b2 + 20 + k * 9;
const Consulting: React.FC<{ f: number; m: Record<string, number> }> = ({ f, m }) => {
  const s = m.b2;
  return (
    <>
      <Title f={f} at={s} text="CONSULTING" />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* The person, in outline: head, body, an arm to the table. */}
        <Line f={f} at={s} c={C.pink} d="M300 540 m-78 0 a78 78 0 1 0 156 0 a78 78 0 1 0 -156 0" />
        <Line f={f} at={s + 4} c={C.pink} d="M220 700 L380 700 L420 1080 L180 1080 Z" fill={`${C.pink}33`} fillAt={s + 20} />
        <Line f={f} at={s + 8} c={C.pink} d="M370 760 L520 870" />
        {/* The table. */}
        <Line f={f} at={s + 6} c={C.yellow} d="M480 900 L920 900 L920 930 L480 930 Z M520 930 L520 1150 M880 930 L880 1150" />
        {/* The bundle, and stalks moved one by one into four piles. */}
        {Array.from({ length: 12 }, (_, i) => {
          if (f < s + 12) return null;
          const t = i < STALK_MOVES ? t01(f, moveAt(m, i), 7) : 0;
          const x0 = 560 + i * 11, x1 = 740 + (i % 4) * 40 + Math.floor(i / 4) * 8;
          const x = x0 + (x1 - x0) * t;
          const y = 780 - Math.sin(Math.PI * t) * 70;
          return <line key={i} x1={x} y1={y} x2={x} y2={y + 116} stroke={C.white} strokeWidth={6} strokeLinecap="round" style={{ filter: glow(C.white, 4) }} />;
        })}
        <Label f={f} at={s + 26} text="YARROW STALKS" x1={640} y1={770} x2={640} y2={640} anchor="middle" />
        <Label f={f} at={s + 40} text={"PERSON WITH\nA QUESTION"} x1={300} y1={1085} x2={300} y2={1180} anchor="middle" />
        {f >= m.future && (
          <text x={300} y={410 - 20 * t01(f, m.future, 30)} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={200} fill={C.orange} style={{ filter: glow(C.orange, 10) }}>?</text>
        )}
      </svg>
    </>
  );
};

// Line 3: Wang Bi, arms folded, looked over by the labels.
const WangBi: React.FC<{ f: number; m: Record<string, number> }> = ({ f, m }) => {
  const s = m.b3;
  const w = m.wangbi;
  return (
    <>
      <Title f={f} at={s} text="WANG BI" zh="王弼" />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* Robe, outline then fill. */}
        <Line f={f} at={s} c={C.blue} d="M400 780 L680 780 L760 1190 L320 1190 Z" fill={`${C.blue}88`} fillAt={s + 16} />
        {/* Head: a face in outline, level brows, a flat mouth. */}
        <Line f={f} at={s + 2} c={C.pink} d="M540 620 m-120 0 a120 125 0 1 0 240 0 a120 125 0 1 0 -240 0" />
        <Line f={f} at={s + 8} c={C.pink} w={7} d="M470 590 L520 590 M560 590 L610 590" />
        <Line f={f} at={s + 10} c={C.pink} w={7} d="M478 625 m-16 0 a16 10 0 1 0 32 0 a16 10 0 1 0 -32 0 M602 625 m-16 0 a16 10 0 1 0 32 0 a16 10 0 1 0 -32 0" />
        <Line f={f} at={s + 12} c={C.pink} w={7} d="M505 690 L575 690" />
        {/* Cap and topknot, filled violet. */}
        <Line f={f} at={s + 4} c={C.violet} d="M430 560 Q540 440 650 560 Q540 505 430 560 Z M515 470 L515 425 L565 425 L565 470" fill={C.violet} fillAt={s + 18} />
        {/* Folded arms across the chest, hands at each end. */}
        <Line f={f} at={s + 10} c={C.yellow} d="M380 880 L700 880 L700 960 L380 960 Z" />
        <Line f={f} at={s + 14} c={C.pink} w={7} d="M395 920 m-26 0 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0 M685 920 m-26 0 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0" />
        <Label f={f} at={w + 10} text="TOPKNOT" x1={570} y1={440} x2={740} y2={470} />
        <Label f={f} at={w + 22} text={"ARMS:\nFOLDED"} x1={712} y1={930} x2={790} y2={1030} />
        <Label f={f} at={w + 34} text={"EXPRESSION:\nUNIMPRESSED"} x1={500} y1={700} x2={400} y2={690} anchor="end" />
        <Label f={f} at={w + 46} text="226–249" x1={540} y1={1195} x2={540} y2={1235} anchor="middle" />
      </svg>
    </>
  );
};

// The narration typed along the bottom: each word's letters spread over the time it is spoken;
// the newest letter white.
const typedAt = (words: GuideWord[]) => {
  const out: { ch: string; at: number }[] = [];
  words.forEach((w, i) => {
    [...w.text.toUpperCase()].forEach((ch, k) => out.push({ ch, at: w.from + ((w.to - w.from) * k) / w.text.length }));
    if (i < words.length - 1) out.push({ ch: " ", at: w.to });
  });
  return out;
};
const Typed: React.FC<{ f: number; words: GuideWord[] }> = ({ f, words }) => {
  const chars = typedAt(words).filter((c) => c.at <= f);
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 1340, fontFamily: sans, fontWeight: 700, fontSize: 52, lineHeight: 1.4, letterSpacing: 3, color: C.blue, filter: glow(C.blue, 6) }}>
      {chars.map((c, i) => (
        <span key={i} style={i === chars.length - 1 && f - c.at < 4 ? { color: C.white } : undefined}>{c.ch}</span>
      ))}
    </div>
  );
};

export const Guide: React.FC<GuideProps> = ({ beats, marks: m }) => {
  const f = useCurrentFrame();
  const current = [...beats].reverse().find((b) => f >= b.from) ?? beats[0];
  // Pages cut hard, as the Guide's did; a faint flicker, like film.
  const flicker = 1 + 0.025 * Math.sin(f * 2.3) * Math.sin(f * 0.7);
  const Page = f >= m.b3 ? WangBi : f >= m.b2 ? Consulting : Book;
  const ticks = beats.flatMap((b) => typedAt(b.words).filter((c, i) => c.ch !== " " && i % 2 === 0).map((c) => Math.round(c.at)));
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <AbsoluteFill style={{ filter: `blur(0.8px) brightness(${flicker}) saturate(1.15)`, opacity: interpolate(f, [4, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <Page f={f} m={m} />
        <Typed f={f} words={current.words} />
      </AbsoluteFill>
      {/* Film softness: a faint vignette. */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)" }} />
      {beats.map((b) => (
        <Sequence key={b.n} from={b.from} layout="none"><Audio src={staticFile(b.src)} /></Sequence>
      ))}
      {ticks.map((t, i) => (
        <Sequence key={`t${i}`} from={t} durationInFrames={3} layout="none"><Audio src={SFX("tick-soft")} volume={0.08} /></Sequence>
      ))}
      <Sequence from={2} layout="none"><Audio src={SFX("boot-flutter")} volume={0.3} /></Sequence>
      {Array.from({ length: 8 }, (_, r) => (
        <Sequence key={r} from={Math.round(m.grid + r * 4.8)} layout="none"><Audio src={SFX("blip-droplet")} volume={0.2} /></Sequence>
      ))}
      {[m.years, m.b2 + 26, m.b2 + 40, m.wangbi + 10, m.wangbi + 22, m.wangbi + 34, m.wangbi + 46].map((t) => (
        <Sequence key={`l${t}`} from={t} layout="none"><Audio src={SFX("blip-hi")} volume={0.18} /></Sequence>
      ))}
      {Array.from({ length: STALK_MOVES }, (_, k) => (
        <Sequence key={k} from={moveAt(m, k) + 6} layout="none"><Audio src={SFX("blip-wood")} volume={0.22} /></Sequence>
      ))}
      <Sequence from={m.future} layout="none"><Audio src={SFX("chime-question")} volume={0.28} /></Sequence>
    </AbsoluteFill>
  );
};
