import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import table from "../../series/hexagrams.json";
import { fonts } from "../lib/fonts";

// A Guide-style short (the user, 2026-09-30: "a Wang Bi 'hitchhikers guide to the universe' style
// short"): a handheld reference device reads its entry on the I Ching in flat, cheerful drawings,
// in the user's own designed voice. Our own device and look: no Guide logo or phrases. Its lid
// carries the six bars of Six Lines. Props come from scripts/guide-props.mjs; the narration and
// picture notes are in series/specials/guide-wangbi.json. This first cut draws lines 1-3.

export type GuideWord = { text: string; from: number; to: number };
export type GuideProps = {
  frames: number;
  beats: { n: number; src: string; from: number; to: number; words: GuideWord[] }[];
  marks: Record<string, number>;
};

// Flat palette: a night-blue desk, a mustard device, a teal screen, bright accents.
const DESK = "#1d2245";
const BODY = "#f2b544";
const BODY_EDGE = "#c98e22";
const BEZEL = "#2b2b33";
const SCREEN = "#12474a";
const SCREEN_OFF = "#1e2226";
const HEADER = "#0c3436";
const CREAM = "#f7f1e3";
const ACCENTS = ["#ff8c42", "#ff6fa0", "#5ec8e5", "#f2d04e"];
const INKBROWN = "#6b4a12";

// Sounds, from the synthesised inventory (series/specials/guide-sfx.json); the user picks by ear
// from out/sfx/guide/audition.m4a, so these are first choices, not final ones.
const SFX = (name: string) => staticFile(`local/sfx/guide/${name}.wav`);
const SWITCH_ON = 9; // frame the screen comes on

// The screen: x 160-920, y 320-1240.
const SX = 160, SY = 320, SW = 760, SH = 920;

const heavy = fonts.signature;

const Device: React.FC<{ on: number; children: React.ReactNode }> = ({ on, children }) => (
  <>
    <div style={{ position: "absolute", left: 70, top: 214, width: 940, height: 1360, borderRadius: 72, background: BODY_EDGE }} />
    <div style={{ position: "absolute", left: 70, top: 200, width: 940, height: 1360, borderRadius: 72, background: BODY }} />
    <div style={{ position: "absolute", left: 130, top: 290, width: 820, height: 980, borderRadius: 38, background: BEZEL }} />
    <div style={{ position: "absolute", left: SX, top: SY, width: SW, height: SH, borderRadius: 20, overflow: "hidden", background: SCREEN_OFF }}>
      {/* Switching on: a bright line opens into the screen. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: SH / 2 - (SH / 2) * on, height: Math.max(6, SH * on), background: on < 1 ? CREAM : SCREEN, opacity: on > 0 ? 1 : 0 }} />
      {on >= 1 && children}
    </div>
    {/* The lid: a red button, the six bars, a speaker grille. */}
    <div style={{ position: "absolute", left: 196, top: 1364, width: 76, height: 76, borderRadius: 38, background: "#e4572e", boxShadow: `0 8px 0 ${BODY_EDGE}` }} />
    <svg width={140} height={96} style={{ position: "absolute", left: 470, top: 1352 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={0} y={i * 16} width={140} height={10} rx={3} fill={INKBROWN} />)}
    </svg>
    <svg width={150} height={100} style={{ position: "absolute", left: 790, top: 1350 }}>
      {Array.from({ length: 20 }, (_, i) => <circle key={i} cx={15 + (i % 5) * 30} cy={14 + Math.floor(i / 5) * 24} r={7} fill={BODY_EDGE} />)}
    </svg>
  </>
);

const Header: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: 76, background: HEADER, color: CREAM, fontFamily: fonts.pixel, fontSize: 38, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", boxSizing: "border-box" }}>
    <span>ENTRY</span>
    <span style={{ display: "flex", gap: 10 }}>{ACCENTS.map((c) => <span key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}</span>
  </div>
);

// One hexagram, bottom line first, drawn w wide.
const Hexagram: React.FC<{ lines: number[]; w: number; color: string }> = ({ lines, w, color }) => {
  const bar = w * 0.11, gap = w * 0.07, h = 6 * bar + 5 * gap;
  return (
    <svg width={w} height={h}>
      {lines.map((l, i) => {
        const y = h - bar - i * (bar + gap);
        return l ? <rect key={i} x={0} y={y} width={w} height={bar} rx={bar / 3} fill={color} /> : (
          <g key={i}>
            <rect x={0} y={y} width={w * 0.42} height={bar} rx={bar / 3} fill={color} />
            <rect x={w * 0.58} y={y} width={w * 0.42} height={bar} rx={bar / 3} fill={color} />
          </g>
        );
      })}
    </svg>
  );
};

const pop = (f: number, at: number, fps: number) => spring({ frame: f - at, fps, config: { damping: 12, stiffness: 180 } });

// Line 1: the title types in, the 64 tile in, the age is stamped.
const Book: React.FC<{ f: number; m: Record<string, number> }> = ({ f, m }) => {
  const { fps } = useVideoConfig();
  const title = "THE I CHING";
  const typed = Math.max(0, Math.min(title.length, Math.floor((f - m.b1) / 1.5)));
  return (
    <>
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center", color: CREAM, fontFamily: heavy, fontSize: 92, letterSpacing: 2 }}>
        {title.slice(0, typed)}
        <span style={{ opacity: typed < title.length || Math.floor(f / 12) % 2 ? 1 : 0, color: ACCENTS[0] }}>▌</span>
      </div>
      {(table as { lines: number[] }[]).map((h, i) => {
        const row = Math.floor(i / 8), col = i % 8;
        const s = pop(f, m.grid + i * 0.6, fps);
        return (
          <div key={i} style={{ position: "absolute", left: 50 + col * 85 + 12, top: 250 + row * 76, transform: `scale(${s})`, opacity: s > 0.01 ? 1 : 0 }}>
            <Hexagram lines={h.lines} w={60} color={ACCENTS[(row + col) % 4]} />
          </div>
        );
      })}
      {f >= m.years && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 856, textAlign: "center", fontFamily: fonts.pixel, fontSize: 40, color: CREAM, transform: `scale(${pop(f, m.years, fps)})` }}>
          ROOTS: ABOUT 3,000 YEARS
        </div>
      )}
    </>
  );
};

// Line 2: someone sorts and counts yarrow stalks; a question floats up.
const STALK_MOVES = 10;
const moveAt = (m: Record<string, number>, k: number) => m.b2 + 14 + k * 9;
const Consulting: React.FC<{ f: number; m: Record<string, number> }> = ({ f, m }) => {
  const { fps } = useVideoConfig();
  const q = pop(f, m.future, fps);
  return (
    <svg width={SW} height={SH} style={{ position: "absolute", left: 0, top: 0 }}>
      <rect x={0} y={760} width={SW} height={SH - 760} fill={HEADER} />
      {/* The person: head, body, an arm reaching to the table. */}
      <circle cx={170} cy={430} r={52} fill="#f4c7a1" />
      <rect x={100} y={490} width={140} height={250} rx={60} fill={ACCENTS[1]} />
      <rect x={200} y={560} width={150} height={34} rx={17} fill={ACCENTS[1]} />
      {/* The table. */}
      <rect x={320} y={600} width={400} height={26} rx={8} fill={BODY} />
      <rect x={350} y={626} width={20} height={134} fill={BODY_EDGE} />
      <rect x={670} y={626} width={20} height={134} fill={BODY_EDGE} />
      {/* The bundle, and stalks moved one by one into four piles. */}
      {Array.from({ length: 12 }, (_, i) => {
        const moved = i < STALK_MOVES && f >= moveAt(m, i);
        const t = i < STALK_MOVES ? Math.min(1, Math.max(0, (f - moveAt(m, i)) / 7)) : 0;
        const x0 = 372 + i * 10, x1 = 540 + (i % 4) * 40 + Math.floor(i / 4) * 7;
        const x = moved ? x0 + (x1 - x0) * t : x0;
        const y = 480 - (moved ? Math.sin(Math.PI * t) * 60 : 0);
        return <rect key={i} x={x} y={y} width={5} height={118} rx={2.5} fill={CREAM} />;
      })}
      {f >= m.future && (
        <text x={170} y={330 - 30 * Math.min(1, (f - m.future) / 40)} textAnchor="middle" fontFamily={heavy} fontSize={150} fill={ACCENTS[0]} transform={`rotate(${-8 * q} 170 300)`} opacity={q}>?</text>
      )}
    </svg>
  );
};

// Line 3: Wang Bi, arms folded; his name and dates.
const WangBi: React.FC<{ f: number; m: Record<string, number> }> = ({ f, m }) => {
  const { fps } = useVideoConfig();
  const card = pop(f, m.wangbi + 6, fps);
  return (
    <>
      <svg width={SW} height={SH} style={{ position: "absolute", left: 0, top: 0 }}>
        <rect x={0} y={760} width={SW} height={SH - 760} fill={HEADER} />
        {/* Robe with wide sleeves. */}
        <path d="M250 470 Q380 430 510 470 L560 760 L200 760 Z" fill="#3a5ba0" />
        {/* Folded arms: one band across the chest, a hand at each end. */}
        <rect x={215} y={540} width={330} height={70} rx={35} fill="#4f74c0" />
        <circle cx={240} cy={575} r={24} fill="#f4c7a1" />
        <circle cx={520} cy={575} r={24} fill="#f4c7a1" />
        {/* Head, cap and topknot; a flat, unimpressed look. */}
        <circle cx={380} cy={380} r={70} fill="#f4c7a1" />
        <path d="M312 360 Q380 280 448 360 L448 340 Q380 250 312 340 Z" fill="#1b1b1f" />
        <rect x={362} y={272} width={36} height={32} rx={12} fill="#1b1b1f" />
        <circle cx={355} cy={392} r={7} fill="#1b1b1f" />
        <circle cx={405} cy={392} r={7} fill="#1b1b1f" />
        <rect x={360} y={420} width={40} height={6} rx={3} fill="#1b1b1f" />
      </svg>
      {f >= m.wangbi && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", color: CREAM, transform: `scale(${card})` }}>
          <span style={{ fontFamily: heavy, fontSize: 64 }}>WANG BI </span>
          <span style={{ fontFamily: fonts.serif, fontSize: 64 }}>王弼</span>
          <div style={{ fontFamily: fonts.pixel, fontSize: 40, marginTop: 6 }}>226–249</div>
        </div>
      )}
    </>
  );
};

// A scene slides out left as the next comes in from the right.
const slide = (f: number, from: number, to: number) => {
  const inX = interpolate(f, [from - 10, from], [SW, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const outX = interpolate(f, [to - 10, to], [0, -SW], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  return f < to - 10 ? inX : outX;
};

// The spoken line under the device, each word lit as it is said.
const Caption: React.FC<{ f: number; words: GuideWord[] }> = ({ f, words }) => (
  <div style={{ position: "absolute", left: 80, right: 80, top: 1620, textAlign: "center", fontFamily: heavy, fontSize: 54, lineHeight: 1.25, color: CREAM }}>
    {words.map((w, i) => (
      <span key={i} style={{ opacity: f >= w.from ? 1 : 0.28, color: f >= w.from && f <= w.to + 2 ? BODY : CREAM }}>{w.text} </span>
    ))}
  </div>
);

export const Guide: React.FC<GuideProps> = ({ beats, marks: m, frames }) => {
  const f = useCurrentFrame();
  const on = interpolate(f, [SWITCH_ON, SWITCH_ON + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const current = [...beats].reverse().find((b) => f >= b.from - 6) ?? beats[0];
  const end = m.b4 ?? frames + 20;
  return (
    <AbsoluteFill style={{ background: DESK }}>
      <Device on={on}>
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${slide(f, 0, m.b2)}px)` }}><Book f={f} m={m} /></div>
        {f >= m.b2 - 10 && <div style={{ position: "absolute", inset: 0, transform: `translateX(${slide(f, m.b2, m.b3)}px)` }}><Consulting f={f} m={m} /></div>}
        {f >= m.b3 - 10 && <div style={{ position: "absolute", inset: 0, transform: `translateX(${slide(f, m.b3, end)}px)` }}><WangBi f={f} m={m} /></div>}
        <Header />
      </Device>
      <Caption f={f} words={current.words} />
      {beats.map((b) => (
        <Sequence key={b.n} from={b.from} layout="none"><Audio src={staticFile(b.src)} /></Sequence>
      ))}
      <Sequence from={SWITCH_ON - 3} layout="none"><Audio src={SFX("boot-flutter")} volume={0.35} /></Sequence>
      {Array.from({ length: 8 }, (_, r) => (
        <Sequence key={r} from={Math.round(m.grid + r * 4.8)} layout="none"><Audio src={SFX("blip-droplet")} volume={0.22} /></Sequence>
      ))}
      <Sequence from={m.years} layout="none"><Audio src={SFX("blip-up")} volume={0.25} /></Sequence>
      <Sequence from={m.b2 - 10} layout="none"><Audio src={SFX("whoosh-up")} volume={0.25} /></Sequence>
      {Array.from({ length: STALK_MOVES }, (_, k) => (
        <Sequence key={k} from={moveAt(m, k) + 6} layout="none"><Audio src={SFX("blip-wood")} volume={0.25} /></Sequence>
      ))}
      <Sequence from={m.future} layout="none"><Audio src={SFX("chime-question")} volume={0.3} /></Sequence>
      <Sequence from={m.b3 - 10} layout="none"><Audio src={SFX("slide")} volume={0.25} /></Sequence>
      <Sequence from={m.wangbi + 6} layout="none"><Audio src={SFX("chime-ding")} volume={0.25} /></Sequence>
    </AbsoluteFill>
  );
};
