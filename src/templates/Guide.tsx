import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import table from "../../series/hexagrams.json";
import { fonts } from "../lib/fonts";
import { IconClose, loadGoudy, OUT, Static } from "./Bookend";

// A Guide-style short (the user, 2026-09-30: "a Wang Bi 'hitchhikers guide to the universe' style
// short"), in the manner of the 1981 BBC television Guide graphics the user sent as reference
// ("the style is funny but not retro enough"): full-screen black; thick, angular neon outlines
// that draw on, then flat fills; small green labels on leader lines; a blue title top left; the
// narration typed in blue capitals, the newest letter white; a soft, glowing film look. Our own
// drawings and words. The shots follow docs/notes/2026-09-30-guide-wangbi-shots.md as revised
// after Astra: four camera moves (shots 2, 4, 6, 8), the rest still. The camera moves the picture
// only; the title and the typed narration stay put. Narration and marks:
// series/specials/guide-wangbi.json; scripts/guide-props.mjs writes the props. The first,
// flat-device cut is in git at 46c8d1f.

export type GuideWord = { text: string; from: number; to: number };
export type GuideProps = {
  frames: number;
  beats: { n: number; src: string; from: number; to: number; words: GuideWord[] }[];
  marks: Record<string, number>;
  close?: { tagline: string; site: string; sfx: string; sfxFrom: number; sfxVolume: number };
};
type M = Record<string, number>;

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
const eased = (f: number, a: number, b: number) => Easing.inOut(Easing.sin)(t01(f, a, b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Angular shapes, as the Guide's were ("more angular and with more lines", Rod Lord).
type P = [number, number];
const poly = (pts: P[]) => `M${pts.map((p) => p.join(" ")).join(" L")} Z`;
const ngon = (cx: number, cy: number, r: number, n: number, rot = 0) =>
  poly(Array.from({ length: n }, (_, i) => [cx + r * Math.cos(rot + (i * 2 * Math.PI) / n), cy + r * Math.sin(rot + (i * 2 * Math.PI) / n)] as P));
const moved = (pts: P[], x: number, y: number, s = 1): P[] => pts.map(([a, b]) => [x + a * s, y + b * s]);

// An outline that draws on from frame at.
const Line: React.FC<{ d: string; c: string; f: number; at: number; w?: number; fill?: string; fillAt?: number; dur?: number }> = ({ d, c, f, at, w = 9, fill, fillAt, dur = DRAW }) =>
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

// Small print, for the freeze-frame reader.
const Small: React.FC<{ f: number; at: number; x: number; y: number; text: string; anchor?: "start" | "end" | "middle" }> = ({ f, at, x, y, text, anchor = "start" }) =>
  f < at ? null : <text x={x} y={y} textAnchor={anchor} fontFamily={sans} fontWeight={700} fontSize={22} letterSpacing={2} fill={C.green} opacity={0.85}>{text}</text>;

// The page title, typed in at two frames a letter; an optional line under it.
const Title: React.FC<{ f: number; at: number; text: string; zh?: string; sub?: string }> = ({ f, at, text, zh, sub }) => {
  const n = Math.max(0, Math.floor((f - at) / 2));
  return (
    <>
      <div style={{ position: "absolute", left: 90, top: 120, color: C.blue, fontFamily: sans, fontWeight: 800, fontSize: 100, letterSpacing: 4, filter: glow(C.blue, 10), whiteSpace: "nowrap" }}>
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
type Cam = { s: number; dx?: number; dy?: number };
const Camera: React.FC<{ f: number; a: number; b: number; from: Cam; to: Cam; ox: number; oy: number; children: React.ReactNode }> = ({ f, a, b, from, to, ox, oy, children }) => {
  const t = eased(f, a, b);
  const s = lerp(from.s, to.s, t), dx = lerp(from.dx ?? 0, to.dx ?? 0, t), dy = lerp(from.dy ?? 0, to.dy ?? 0, t);
  return <div style={{ position: "absolute", inset: 0, transformOrigin: `${ox}px ${oy}px`, transform: `translate(${dx}px, ${dy}px) scale(${s})` }}>{children}</div>;
};
const Still: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ position: "absolute", inset: 0 }}>{children}</div>;
const Pic: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>{children}</svg>;

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

// The person with a question (shot 2) and, later, a decision (shot 8): same figure, same label.
const Person: React.FC<{ f: number; at: number; arm: string }> = ({ f, at, arm }) => (
  <>
    <Line f={f} at={at} c={C.pink} d={ngon(300, 540, 82, 6, Math.PI / 6)} />
    <Line f={f} at={at + 4} c={C.pink} d={poly([[240, 690], [360, 690], [395, 735], [425, 1080], [175, 1080], [205, 735]])} fill={`${C.pink}33`} fillAt={at + 20} />
    <Line f={f} at={at + 8} c={C.pink} d={arm} />
  </>
);

// Line 1: the 64 land one by one, each flashing white; the age on a label. Still.
const Book: React.FC<{ f: number; m: M }> = ({ f, m }) => (
  <>
    <Title f={f} at={m.b1} text="THE I-CHING" />
    <Still>
      <Pic>
        {(table as { lines: number[] }[]).map((h, i) => {
          const at = m.grid + i * 0.6;
          if (f < at) return null;
          const row = Math.floor(i / 8), col = i % 8;
          return <Hexagram key={i} lines={h.lines} x={100 + col * 115} y={340 + row * 105} w={76} c={f < at + 2 ? C.white : CYCLE[(row + col) % CYCLE.length]} />;
        })}
        <Label f={f} at={m.years} text="ROOTS: ABOUT 3,000 YEARS" x1={540} y1={1195} x2={540} y2={1235} anchor="middle" />
      </Pic>
    </Still>
  </>
);

// Line 2: stalks counted into piles; the camera pulls back from them to the person; a question.
const STALK_MOVES = 10;
const moveAt = (m: M, k: number) => m.b2 + 6 + k * 9;
const Consulting: React.FC<{ f: number; m: M }> = ({ f, m }) => {
  const s = m.b2;
  return (
    <>
      <Title f={f} at={s} text="CONSULTING" />
      <Camera f={f} a={s} b={m.consulted + 14} from={{ s: 1.3 }} to={{ s: 1 }} ox={700} oy={860}>
        <Pic>
          <Person f={f} at={s} arm="M380 760 L470 830 L520 870" />
          <Line f={f} at={s} c={C.yellow} d="M480 900 L920 900 L920 930 L480 930 Z M520 930 L520 1150 M880 930 L880 1150" dur={8} />
          {Array.from({ length: 12 }, (_, i) => {
            const t = i < STALK_MOVES ? t01(f, moveAt(m, i), 7) : 0;
            const x0 = 560 + i * 11, x1 = 740 + (i % 4) * 40 + Math.floor(i / 4) * 8;
            const x = lerp(x0, x1, t);
            const y = 780 - Math.sin(Math.PI * t) * 70;
            return <line key={i} x1={x} y1={y} x2={x} y2={y + 116} stroke={C.white} strokeWidth={6} strokeLinecap="round" style={{ filter: glow(C.white, 4) }} />;
          })}
          <Small f={f} at={s} x={560} y={765} text="STALK 37 OF 49" />
          <Label f={f} at={s + 20} text="YARROW STALKS" x1={640} y1={740} x2={640} y2={640} anchor="middle" />
          <Label f={f} at={m.consulted} text={"PERSON WITH\nA QUESTION"} x1={300} y1={1085} x2={300} y2={1180} anchor="middle" />
          {f >= m.future && (
            <text x={300} y={410 - 20 * t01(f, m.future, 30)} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={200} fill={C.orange} style={{ filter: glow(C.orange, 10) }}>?</text>
          )}
        </Pic>
      </Camera>
    </>
  );
};

// Line 3: Wang Bi draws on fast and holds; one eyebrow rises on "instructions". Still.
const WangBi: React.FC<{ f: number; m: M }> = ({ f, m }) => {
  const s = m.b3;
  const brow = eased(f, m.instructions, m.instructions + 6);
  return (
    <>
      <Title f={f} at={s} text="WANG BI" zh="王弼" sub="AD 226–249" />
      <Still>
        <Pic>
          <Line f={f} at={s} c={C.blue} d={poly([[400, 780], [680, 780], [760, 1190], [320, 1190]])} fill={`${C.blue}88`} fillAt={s + 14} dur={10} />
          <Line f={f} at={s} c={C.blue} w={6} d="M470 780 L540 860 L610 780" dur={10} />
          <Line f={f} at={s + 2} c={C.pink} d={ngon(540, 625, 128, 8, Math.PI / 8)} dur={10} />
          <Line f={f} at={s + 6} c={C.pink} w={7} d="M468 592 L520 596" dur={6} />
          <g transform={`translate(0 ${-14 * brow}) rotate(${-7 * brow} 585 594)`}>
            <Line f={f} at={s + 6} c={C.pink} w={7} d="M560 596 L612 592" dur={6} />
          </g>
          <Line f={f} at={s + 8} c={C.pink} w={6} d={`${ngon(492, 630, 13, 4)} ${ngon(588, 630, 13, 4)}`} dur={6} />
          <Line f={f} at={s + 10} c={C.pink} w={7} d="M505 695 L575 695" dur={6} />
          <Line f={f} at={s + 4} c={C.violet} d={`${poly([[425, 560], [465, 495], [615, 495], [655, 560], [540, 530]])} ${poly([[515, 495], [515, 440], [565, 440], [565, 495]])}`} fill={C.violet} fillAt={s + 16} dur={10} />
          <Line f={f} at={s + 8} c={C.yellow} d={poly([[370, 880], [710, 880], [720, 960], [360, 960]])} dur={8} />
          <Line f={f} at={s + 12} c={C.pink} w={7} d={`${ngon(385, 920, 26, 5)} ${ngon(695, 920, 26, 5)}`} dur={6} />
          <Label f={f} at={m.wangbi + 18} text={"EXPRESSION:\nNOT RECORDED"} x1={500} y1={705} x2={400} y2={700} anchor="end" />
        </Pic>
      </Still>
    </>
  );
};

// Line 4: a candle burns down and goes out ("died young"); beside it his commentary piles up.
// The camera tilts up with the stack; the candle stays in view.
const PAGES = 32;
const pageAt = (m: M, k: number) => m.b4 + 8 + k * 3.2;
const pageJitter = (k: number) => ((k * 37) % 13) - 6;
const Commentary: React.FC<{ f: number; m: M }> = ({ f, m }) => {
  const s = m.b4;
  const n = Array.from({ length: PAGES }, (_, k) => k).filter((k) => f >= pageAt(m, k)).length;
  const top = 1120 - n * 12;
  const burn = eased(f, s + 4, m.young + 4);
  const candleTop = lerp(820, 1040, burn);
  const out = f >= m.young + 6;
  return (
    <>
      <Title f={f} at={s} text="COMMENTARY" />
      <Camera f={f} a={s + 20} b={m.e4 - 15} from={{ s: 1 }} to={{ s: 1, dy: 120 }} ox={540} oy={900}>
        <Pic>
          <Line f={f} at={s} c={C.yellow} d={poly([[200, candleTop], [270, candleTop], [270, 1120], [200, 1120]])} dur={8} />
          <Line f={f} at={s} c={C.yellow} d="M160 1120 L310 1120" dur={8} />
          {!out && f >= s + 4 && <path d={poly([[235, candleTop - 70], [255, candleTop - 25], [235, candleTop - 5], [215, candleTop - 25]])} fill={C.orange} style={{ filter: glow(C.orange, 10) }} />}
          {out && <path d={`M235 ${candleTop - 10} L225 ${candleTop - 40} L245 ${candleTop - 70} L230 ${candleTop - 100}`} stroke={C.white} strokeWidth={4} fill="none" opacity={Math.max(0, 0.7 - (f - m.young - 6) / 40)} />}
          {Array.from({ length: n }, (_, k) => (
            <rect key={k} x={580 + pageJitter(k)} y={1120 - (k + 1) * 12} width={340} height={8} fill="none" stroke={C.white} strokeWidth={3} style={{ filter: glow(C.white, 3) }} />
          ))}
          <Small f={f} at={pageAt(m, 0)} x={920} y={1156} text="PAGE 1 OF MANY" anchor="end" />
          <Label f={f} at={s + 16} text={"周易注\nCOMMENTARY\nON THE CHANGES"} x1={575} y1={1000} x2={540} y2={800} anchor="end" />
          <Label f={f} at={m.standard} text="OFFICIAL STANDARD: AD 653" x1={750} y1={top - 4} x2={690} y2={top - 60} anchor="middle" />
        </Pic>
      </Camera>
    </>
  );
};

// A horse, drawn in a 300 x 210 box.
const HORSE: P[] = [[20, 40], [62, 8], [92, 26], [84, 66], [122, 86], [232, 86], [282, 60], [274, 116], [244, 104], [246, 206], [226, 206], [214, 128], [132, 128], [124, 206], [104, 206], [98, 118], [70, 88], [22, 64]];

// Line 5: the gallery of images, all in frame; they dim together on "forget". Still.
const Images: React.FC<{ f: number; m: M }> = ({ f, m }) => {
  const s = m.b5;
  const dim = lerp(1, 0.22, eased(f, m.forget, m.forget + 10));
  return (
    <>
      <Title f={f} at={s} text="IMAGES" />
      <Still>
        <Pic>
          <g opacity={dim}>
            {/* Dragon. */}
            <Line f={f} at={s} c={C.yellow} d="M110 690 L170 600 L230 720 L290 610 L340 700 M110 690 L60 650 L80 700 L60 740 Z M80 655 L70 610 M95 660 L100 615" dur={10} />
            {/* Horse. */}
            <Line f={f} at={s + 3} c={C.orange} d={poly(moved(HORSE, 380, 560, 1.05))} dur={10} />
            {/* Cart. */}
            <Line f={f} at={s + 6} c={C.pink} d={`${poly([[760, 600], [980, 600], [980, 690], [760, 690]])} ${ngon(820, 740, 55, 8)} M820 685 L820 795 M765 740 L875 740 M781 701 L859 779 M781 779 L859 701 M980 645 L1030 610`} dur={10} />
          </g>
          <text x={540} y={960} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={44} letterSpacing={3} fill={C.green} style={{ filter: glow(C.green, 5) }}>
            <tspan x={540}>得意忘象</tspan>
            <tspan x={540} dy={60}>GRASP THE MEANING,</tspan>
            <tspan x={540} dy={56}>FORGET THE IMAGE</tspan>
          </text>
        </Pic>
      </Still>
    </>
  );
};

// A fish, in a 200 x 60 box.
const FISH: P[] = [[0, 30], [50, 0], [130, 18], [160, 30], [200, 4], [200, 56], [160, 30], [130, 42], [50, 60]];

// Line 6: the trap, a fish in it; a hand lifts the fish out and the camera goes with it; the trap
// is set aside, slumps and dims.
const FishTrap: React.FC<{ f: number; m: M }> = ({ f, m }) => {
  const s = m.b6;
  const lift = eased(f, m.catch + 8, m.put);
  const fx = lerp(320, 760, lift), fy = lerp(740, 520, Math.min(1, lift * 1.4));
  const hand = eased(f, m.catch, m.catch + 8);
  const slump = eased(f, m.put, m.put + 12);
  const hoops = [250, 350, 450, 550].map((x) => {
    const half = lerp(20, 130, (x - 150) / 470);
    return `M${x} ${770 - half} L${x} ${770 + half}`;
  });
  return (
    <>
      <Title f={f} at={s} text="FISH TRAP" zh="筌" />
      <Camera f={f} a={m.catch + 8} b={m.put + 10} from={{ s: 1 }} to={{ s: 1, dx: -160 }} ox={540} oy={800}>
        <Pic>
          <g opacity={lerp(1, 0.35, slump)} transform={`rotate(${6 * slump} 150 770) translate(0 ${20 * slump})`}>
            <Line f={f} at={s} c={C.orange} d={`${poly([[620, 640], [620, 900], [150, 790], [150, 750]])} ${hoops.join(" ")} M150 770 L620 700 M150 770 L620 840`} />
            <Label f={f} at={m.trap} text={"筌 FISH TRAP\n= IMAGE"} x1={400} y1={850} x2={380} y2={960} anchor="middle" />
          </g>
          <Line f={f} at={s + 10} c={C.mint} d={poly(moved(FISH, fx, fy))} fill={`${C.mint}55`} fillAt={s + 22} />
          {hand > 0 && (
            <path d={poly(moved([[0, 0], [70, 0], [80, 60], [60, 110], [45, 70], [25, 110], [0, 60]], fx + 60, lerp(-200, fy - 105, hand)))} stroke={C.pink} strokeWidth={8} strokeLinejoin="round" fill="none" style={{ filter: glow(C.pink) }} />
          )}
          <Label f={f} at={m.catch + 12} text={"FISH\n= MEANING"} x1={fx + 100} y1={fy + 64} x2={fx + 100} y2={fy + 150} anchor="middle" />
        </Pic>
      </Camera>
      <Pic><Small f={f} at={s + 20} x={990} y={1270} text="ANALOGY: ZHUANGZI, CH. 26" anchor="end" /></Pic>
    </>
  );
};

// Line 7: the horse; STRENGTH appears, then the horse fades and the word stays. Still.
const Horse: React.FC<{ f: number; m: M }> = ({ f, m }) => {
  const s = m.b7;
  const fade = 1 - eased(f, m.insist, m.e7 - 4);
  return (
    <>
      <Title f={f} at={s} text="HORSE" />
      <Still>
        <Pic>
          <g opacity={fade}>
            <Line f={f} at={s} c={C.orange} d={poly(moved(HORSE, 240, 460, 2))} fill={`${C.orange}33`} fillAt={s + 16} />
          </g>
          {f >= m.strength && (
            <text x={540} y={1080} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={110} letterSpacing={6} fill={C.yellow} style={{ filter: glow(C.yellow, 12) }} opacity={t01(f, m.strength, 3)}>
              健 STRENGTH
            </text>
          )}
        </Pic>
      </Still>
    </>
  );
};

// Line 8: the same person at a fork, a small Six Lines page open beside them; the camera pushes
// toward the fork and stops before either road is taken.
const Fork: React.FC<{ f: number; m: M }> = ({ f, m }) => {
  const s = m.b8;
  return (
    <>
      <Title f={f} at={s} text="SIX LINES" />
      <Camera f={f} a={s + 8} b={m.e8 - 15} from={{ s: 1 }} to={{ s: 1.1 }} ox={780} oy={700}>
        <Pic>
          <Line f={f} at={s} c={C.yellow} d="M470 1200 L730 660 L600 430 M1050 1200 L830 660 L960 430 M690 430 L780 700 L870 430" />
          <Line f={f} at={s + 6} c={C.yellow} w={6} d="M760 1180 L772 1110 M784 1040 L794 980 M804 920 L810 870 M818 820 L822 780 M760 640 L730 590 M705 550 L685 520 M880 640 L910 590 M935 550 L955 520" dur={8} />
          <Person f={f} at={s} arm="M380 760 L430 820" />
          <Line f={f} at={s + 10} c={C.white} w={6} d="M410 800 L460 815 L510 800 L510 870 L460 885 L410 870 Z M460 815 L460 885" dur={8} />
          {f >= s + 18 && [0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={470} y={825 + i * 9} width={32} height={5} fill={C.white} />)}
          <Label f={f} at={m.judgment} text={"PERSON WITH\nA DECISION"} x1={300} y1={1085} x2={300} y2={1180} anchor="middle" />
        </Pic>
      </Camera>
    </>
  );
};

// Line 9: the summary. Its two rows are the typed narration, set in the middle; a tick, a cross.
const Summary: React.FC<{ f: number; m: M }> = ({ f, m }) => <Title f={f} at={m.b9} text="SUMMARY" />;

// The narration typed in blue capitals: each word's letters spread over the time it is spoken;
// the newest letter white. On the summary page the rows break before "Not", with a tick and a
// cross after them.
type Ch = { ch: string; at: number; color?: string };
const typedAt = (words: GuideWord[], summary = false) => {
  const out: Ch[] = [];
  words.forEach((w, i) => {
    if (summary && w.text === "Not") out.push({ ch: "\n", at: w.from });
    [...w.text.toUpperCase()].forEach((ch, k) => out.push({ ch, at: w.from + ((w.to - w.from) * k) / w.text.length }));
    if (summary && (w.text === "decisions." || i === words.length - 1)) out.push({ ch: i === words.length - 1 ? " ✗" : " ✓", at: w.to + 6, color: i === words.length - 1 ? C.red : C.green });
    else if (i < words.length - 1) out.push({ ch: " ", at: w.to });
  });
  return out;
};
const Typed: React.FC<{ f: number; words: GuideWord[]; summary: boolean }> = ({ f, words, summary }) => {
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

const PAGES_IN_ORDER: [string, React.FC<{ f: number; m: M }>][] = [
  ["b1", Book], ["b2", Consulting], ["b3", WangBi], ["b4", Commentary], ["b5", Images], ["b6", FishTrap], ["b7", Horse], ["b8", Fork], ["b9", Summary],
];

export const Guide: React.FC<GuideProps> = ({ beats, marks: m, close }) => {
  loadGoudy();
  const f = useCurrentFrame();
  const current = [...beats].reverse().find((b) => f >= b.from) ?? beats[0];
  const Page = [...PAGES_IN_ORDER].reverse().find(([k]) => m[k] !== undefined && f >= m[k])?.[1] ?? Book;
  // Pages cut hard, as the Guide's did; a faint flicker, like film.
  const flicker = 1 + 0.025 * Math.sin(f * 2.3) * Math.sin(f * 0.7);
  const ticks = beats.flatMap((b) => typedAt(b.words).filter((c, i) => c.ch !== " " && i % 2 === 0).map((c) => Math.round(c.at)));
  const ivory = close && (f >= m.close + OUT.length || (f >= m.close && OUT[f - m.close]));
  const cue = (name: string, at: number, volume: number) => <Sequence key={`${name}${at}`} from={Math.round(at)} layout="none"><Audio src={SFX(name)} volume={volume} /></Sequence>;
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <AbsoluteFill style={{ filter: `blur(0.8px) brightness(${flicker}) saturate(1.15)`, opacity: interpolate(f, [4, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <Page f={f} m={m} />
        <Typed f={f} words={current.words} summary={current.n === 9} />
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
      {Array.from({ length: 8 }, (_, r) => cue("blip-droplet", m.grid + r * 4.8, 0.2))}
      {[m.years, m.b2 + 20, m.consulted, m.wangbi + 18, m.b4 + 16, m.standard, m.trap, m.catch + 12, m.judgment].map((t) => cue("blip-hi", t, 0.18))}
      {Array.from({ length: STALK_MOVES }, (_, k) => cue("blip-wood", moveAt(m, k) + 6, 0.22))}
      {cue("chime-question", m.future, 0.28)}
      {cue("blip-up", m.instructions, 0.16)}
      {cue("off-drop", m.young + 6, 0.14)}
      {Array.from({ length: PAGES / 2 }, (_, k) => cue("tick-soft", pageAt(m, k * 2), 0.1))}
      {cue("whoosh-down", m.forget, 0.18)}
      {cue("blip-droplet", m.catch + 8, 0.25)}
      {cue("blip-wood", m.put + 10, 0.3)}
      {cue("chime-ding", m.strength, 0.22)}
      {cue("blip-up", m.not - 8, 0.2)}
      {cue("error-buzz", m.e9 + 6, 0.16)}
      {close && <Static src={close.sfx} at={m.close} from={close.sfxFrom} volume={close.sfxVolume} />}
    </AbsoluteFill>
  );
};
