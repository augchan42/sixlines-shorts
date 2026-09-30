import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fonts } from "../lib/fonts";
import { IconClose, loadGoudy, OUT, Static } from "./Bookend";
import type { GuideWord } from "./Guide";

// A talking head from Blender (blender/urizen.py --props) with the Guide's typed captions over
// it: Urizen on Qian's top line (series/specials/urizen-qian6.json). The user, 2026-09-30: "let's
// go ahead and do a short with the Urizen talking head with the line six". Urizen's words are
// typed in ivory, the Guide narrator's in the Guide's blue; green labels as the Guide's; the
// hexagram's top line turns amber when the narrator names it (amber marks the line to look at).
// scripts/guide-props.mjs writes the props, the head's jaw included.
// When the narrator takes over, the head eases into a framed entry card, middle left, and the
// hexagram draws on beside it; on "Withdraw?" it cuts back to full screen (Astra's brainstorm,
// docs/research/2026-10-01-codex-urizen-motion.md, after the user: 'Urizen with the guide is a bit
// flat, i feel like it needs some more movement or a transition between urizen and the narrator').

export type TalkingHeadProps = {
  frames: number;
  video: string; // the head's frames as a video, under public/
  beats: { n: number; src: string; from: number; to: number; words: GuideWord[]; voice?: string }[];
  marks: Record<string, number>;
  close?: { tagline: string; site: string; sfx: string; sfxFrom: number; sfxVolume: number };
};

const C = { blue: "#3170ff", green: "#3fe46d", amber: "#ffb040", ivory: "#fff0dc", white: "#f4f6ff" };
const sans = loadMontserrat("normal", { weights: ["700", "800"], subsets: ["latin"] }).fontFamily;
const SFX = (name: string) => staticFile(`local/sfx/guide/${name}.wav`);
const glow = (c: string, r = 8) => `drop-shadow(0 0 ${r / 2}px ${c}) drop-shadow(0 0 ${r * 2}px ${c}99)`;
const t01 = (f: number, a: number, d: number) => Math.min(1, Math.max(0, (f - a) / d));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// The entry card: the head scaled by CARD.k about the top left, so the face (FACE, in the video)
// sits in the middle of the card's rectangle; eased in over CARD.ease frames.
const CARD = { x: 40, y: 360, w: 620, h: 880, k: 0.75, ease: 40 };
const FACE = { x: 640, y: 820 };
const Head: React.FC<{ video: string; t: number }> = ({ video, t }) => {
  const k = lerp(1, CARD.k, t);
  const tx = lerp(0, CARD.x + CARD.w / 2 - CARD.k * FACE.x, t);
  const ty = lerp(0, CARD.y + CARD.h / 2 - CARD.k * FACE.y, t);
  const [x, y, w, h] = [lerp(0, CARD.x, t), lerp(0, CARD.y, t), lerp(1080, CARD.w, t), lerp(1920, CARD.h, t)];
  return (
    <>
      <AbsoluteFill style={{ clipPath: `inset(${y}px ${1080 - x - w}px ${1920 - y - h}px ${x}px)` }}>
        <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${k})` }}>
          <OffthreadVideo src={staticFile(video)} muted />
        </AbsoluteFill>
      </AbsoluteFill>
      {t > 0 && <div style={{ position: "absolute", left: x, top: y, width: w, height: h, border: `4px solid ${C.green}`, opacity: t, filter: glow(C.green, 5), boxSizing: "border-box" }} />}
    </>
  );
};

// Each letter at its share of its word's spoken frames.
const lettersOf = (words: GuideWord[]) =>
  words.flatMap((w, i) => [
    ...[...w.text.toUpperCase()].map((ch, k) => ({ ch, at: w.from + ((w.to - w.from) * k) / w.text.length })),
    ...(i < words.length - 1 ? [{ ch: " ", at: w.to }] : []),
  ]);

const Typed: React.FC<{ f: number; words: GuideWord[]; colour: string }> = ({ f, words, colour }) => {
  const shown = lettersOf(words).filter((c) => c.at <= f);
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 96, fontFamily: sans, fontWeight: 700, fontSize: 46, lineHeight: 1.36, letterSpacing: 3, color: colour, filter: glow(colour, 6) }}>
      {shown.map((c, i) => <span key={i} style={i === shown.length - 1 && f - c.at < 4 ? { color: C.white } : undefined}>{c.ch}</span>)}
    </div>
  );
};

// Green lines of small capitals, popping in at frame at.
const Label: React.FC<{ f: number; at: number; x: number; y: number; lines: string[]; colour?: string; size?: number }> = ({ f, at, x, y, lines, colour = C.green, size = 32 }) =>
  f < at ? null : (
    <div style={{ position: "absolute", left: x, top: y, fontFamily: sans, fontWeight: 800, fontSize: size, lineHeight: 1.3, letterSpacing: 3, color: colour, filter: glow(colour, 5), whiteSpace: "pre" }}>
      {lines.join("\n")}
    </div>
  );

// Qian: six solid lines drawn on bottom first, in the right column clear of the beard.
const X = 690;
const BAR = 290;
const TOP = 1300;
const Hexagram: React.FC<{ f: number; at: number; top: number }> = ({ f, at, top }) =>
  f < at ? null : (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 6 }, (_, i) => {
        const y = TOP + (5 - i) * 52;
        const lit = i === 5 && f >= top;
        const c = lit ? C.amber : C.green;
        return <rect key={i} x={X} y={y} width={BAR * t01(f, at + i * 3, 6)} height={26} fill={c} style={{ filter: glow(c, lit ? 10 : 5) }} />;
      })}
    </svg>
  );

export const TalkingHead: React.FC<TalkingHeadProps> = ({ video, beats, marks: m, close }) => {
  loadGoudy();
  const f = useCurrentFrame();
  const current = [...beats].reverse().find((b) => f >= b.from) ?? beats[0];
  const guide = current.voice === "guide";
  const ivory = close && (f >= m.close + OUT.length || (f >= m.close && OUT[f - m.close]));
  const ticks = beats.filter((b) => b.voice === "guide").flatMap((b) => lettersOf(b.words).filter((c, i) => c.ch !== " " && i % 2 === 0).map((c) => Math.round(c.at)));
  const cue = (name: string, at: number, volume: number) => <Sequence key={`${name}${at}`} from={Math.round(at)} layout="none"><Audio src={SFX(name)} volume={volume} /></Sequence>;
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <Head video={video} t={f >= m.b7 ? 0 : Easing.inOut(Easing.sin)(t01(f, m.b4, CARD.ease))} />
      {/* A dark band under the captions, so they read over the hair. */}
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.75) 0px, rgba(0,0,0,0.5) 300px, transparent 420px)" }} />
      {f >= current.from - 2 && f < m.close && <Typed f={f} words={current.words} colour={guide ? C.blue : C.ivory} />}
      <Label f={f} at={m.b1 + 20} x={X} y={1330} lines={f < m.b4 ? ["SUBJECT: URIZEN"] : []} />
      {f >= m.b4 && f < m.b7 && (
        <>
          <Label f={f} at={m.b4 + CARD.ease} x={CARD.x} y={CARD.y - 48} lines={["ENTRY: URIZEN"]} size={28} />
          <Label f={f} at={m.hexagram} x={X} y={TOP - 64} lines={["乾 QIÁN"]} />
          <Hexagram f={f} at={m.hexagram} top={m.top} />
          <Label f={f} at={m.top} x={X + BAR + 18} y={TOP - 4} lines={["TOP"]} colour={C.amber} size={26} />
          {f >= m.quote && (
            <div style={{ position: "absolute", left: X, top: TOP + 330, width: 380, color: C.green, filter: glow(C.green, 5) }}>
              <div style={{ fontFamily: fonts.serif, fontSize: 44, letterSpacing: 4 }}>知進而不知退</div>
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 22, lineHeight: 1.3, letterSpacing: 1.5, marginTop: 8 }}>KNOWS HOW TO ADVANCE,<br />NOT HOW TO WITHDRAW</div>
            </div>
          )}
          {/* On "makes rules": a leader from the card to what he does. */}
          {f >= m.rules && (
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <line x1={CARD.x + CARD.w} y1={960} x2={X - 10} y2={1000} stroke={C.green} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t01(f, m.rules, 5)} style={{ filter: glow(C.green, 5) }} />
            </svg>
          )}
          <Label f={f} at={m.rules + 4} x={X} y={985} lines={["OCCUPATION:", "MEASURING"]} />
        </>
      )}
      {ivory && close && <IconClose tagline={close.tagline} site={close.site} />}

      {beats.map((b) => (
        <Sequence key={b.n} from={b.from} layout="none"><Audio src={staticFile(b.src)} /></Sequence>
      ))}
      {ticks.map((t, i) => (
        <Sequence key={`t${i}`} from={t} durationInFrames={3} layout="none"><Audio src={SFX("tick-soft")} volume={0.08} /></Sequence>
      ))}
      {cue("blip-hi", m.hexagram, 0.18)}
      {cue("blip-up", m.top, 0.18)}
      {cue("off-drop", m.e7 + 1, 0.2)}
      {close && <Static src={close.sfx} at={m.close} from={close.sfxFrom} volume={close.sfxVolume} />}
    </AbsoluteFill>
  );
};
