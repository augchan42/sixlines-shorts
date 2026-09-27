import { AbsoluteFill, Audio, interpolate, random, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Soundtrack } from "../fx/Soundtrack";
import { fonts } from "../lib/fonts";
import { EndCard3D } from "../scenes/EndCard3D";
import { BLUE, Hud, type Field } from "../scenes/Hud";
import { boxEdges, DIM, DOES, glow, Line, LINE_H, LINE_W, LogRowView, lineZ, PHOSPHOR, Readout, slabsOf, type Trigram } from "../scenes/Readout";

// How Wang Bi reads a hexagram (series/explainers/wangbi-lesson.json), as an inquiry at the
// terminal: after MU/TH/UR in Alien (a question typed, the answer typed back) and Paul's
// filmbook in Lynch's Dune (one fact to a page, chapter pages between). Each page clears the
// screen and draws only the part of the readout its answer is about. Text only, with a
// teletype tick while typing. Rendered by scripts/explainer.mjs wangbi-lesson.

const AMBER = "#ffb347";
const CYAN = "#5ee7ff";

type Hex = { number: number; name: string; lines: (0 | 1)[]; trigrams: [Trigram, Trigram] };
type Show = {
  hex?: number | "pair";
  small?: [number, number];
  draw?: boolean;
  log?: ("yy" | "place" | "centre")[];
  lit?: number[];
  amber?: number[];
  links?: [number, number][];
  // Draw the links in blue: only on the pages that teach answering lines.
  blue?: boolean;
  brackets?: boolean;
  names?: boolean;
  ranks?: boolean;
  big?: string;
  lesson?: string;
  full?: { n: number; after: number }[];
  then?: ({ after: number } & Show)[];
};
type Page = { chapter?: string; q?: string; a?: string; show?: Show };
type Full = { number: number; name: string; lines: (0 | 1)[]; trigrams: [Trigram, Trigram]; text: string; mark?: number[]; finding?: string; master?: { zh: string; en: string } };
export type LessonProps = {
  pages: Page[];
  hexagrams: Record<string, Hex>;
  readouts: Record<string, Full>;
  music: string;
  musicStart: number;
  ticks: string;
  endcard: { clip: string; seconds: number };
};

const FPS = 30;
const Q_RATE = 1.1; // frames per character
const A_RATE = 0.9;
const FULL = 4 * FPS;
const CHAPTER = Math.round(1.5 * FPS);

// Each page's timeline: the query typed, then each answer line in turn, with any cut to a
// full readout after a given line, then a hold long enough to read it.
type Timed = { page: Page; from: number; frames: number; qAt: number; aAt: number; lineAt: number[]; fulls: { n: number; from: number }[] };
export const lessonPlan = (p: LessonProps): { pages: Timed[]; end: number } => {
  let t = 0;
  const pages = p.pages.map((page) => {
    const from = t;
    if (page.chapter) {
      t += CHAPTER;
      return { page, from, frames: CHAPTER, qAt: 0, aAt: 0, lineAt: [], fulls: [] };
    }
    const q = page.q ?? "";
    const lines = (page.a ?? "").split("\n");
    const qAt = 10;
    const aAt = qAt + Math.round((q.length + 2) * Q_RATE) + 12;
    let at = aAt;
    const lineAt: number[] = [];
    const fulls: { n: number; from: number }[] = [];
    lines.forEach((l, i) => {
      lineAt.push(at);
      at += Math.round(l.length * A_RATE) + 6;
      for (const f of page.show?.full ?? []) if (f.after === i + 1) (fulls.push({ n: f.n, from: at }), (at += FULL));
    });
    const words = (page.a ?? "").split(/\s+/).length + (page.show?.lesson ?? "").split(/\s+/).length;
    const hold = Math.max(2.5, words / 3.7) * FPS + (page.show?.draw ? FPS : 0);
    const frames = Math.max(Math.round(3.5 * FPS), (fulls.length ? at - aAt : at) + Math.round(fulls.length ? FPS : hold));
    t += frames;
    return { page, from, frames, qAt, aAt, lineAt, fulls };
  });
  return { pages, end: t };
};
export const lessonFrames = (p: LessonProps) => lessonPlan(p).end + Math.round(p.endcard.seconds * FPS);

// The page's drawing at `sec` seconds after its answer began: `then` entries change it in turn.
const showAt = (show: Show, sec: number): Show => {
  let s: Show = show;
  for (const t of show.then ?? []) if (sec >= t.after) s = { ...s, ...t };
  return s;
};

const CX = 450;
const CY = 850;
const SCALE = 86;

// One hexagram's plot: `drawn` 0..1 draws it bottom line first.
const Plot: React.FC<{ lines: (0 | 1)[]; turn: number; cx: number; cy: number; scale: number; drawn: number; lit?: number[]; amber?: number[] }> = ({ lines, turn, cx, cy, scale, drawn, lit, amber = [] }) => (
  <g fill="none" strokeWidth={2.6} style={{ filter: `drop-shadow(0 0 6px ${PHOSPHOR})` }}>
    {slabsOf(lines).map((s, k) => {
      const d = Math.min(1, Math.max(0, drawn * 6 - s.i));
      if (d <= 0) return null;
      const on = !lit || lit.includes(s.i) || amber.includes(s.i);
      return <path key={k} d={boxEdges(s.x0, s.x1, s.z, turn, scale, cx, cy)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - d} stroke={amber.includes(s.i) ? AMBER : PHOSPHOR} opacity={on ? 1 : 0.22} />;
    })}
  </g>
);

const place = (lines: (0 | 1)[], i: number) => (i === 0 || i === 5 ? "" : lines[i] === (i % 2 === 0 ? 1 : 0) ? "IN " : "OUT");

const Drawing: React.FC<{ show: Show; hexagrams: Record<string, Hex>; turn: number; drawn: number }> = ({ show, hexagrams, turn, drawn }) => {
  if (show.big) {
    const [top, under] = show.big.split("\n");
    return (
      <div style={{ position: "absolute", top: 640, left: 50, width: 780, textAlign: "center", color: AMBER, textShadow: `0 0 14px ${AMBER}` }}>
        <div style={{ fontFamily: fonts.pixel, fontSize: 300, lineHeight: 1.1 }}>{top}</div>
        <div style={{ fontFamily: fonts.pixel, fontSize: 60 }}>{under}</div>
      </div>
    );
  }
  if (show.small) {
    return (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {show.small.map((n, k) => {
            const h = hexagrams[n];
            const lone = h.lines.findIndex((l) => h.lines.filter((m) => m === l).length === 1);
            const partner = (lone + 3) % 6;
            const cx = k ? 640 : 270;
            const x = cx - (LINE_W / 2) * 50 - 26;
            const [ya, yb] = [CY - lineZ(Math.min(lone, partner)) * 50, CY - lineZ(Math.max(lone, partner)) * 50];
            return (
              <g key={n}>
                <Plot lines={h.lines} turn={turn} cx={cx} cy={CY} scale={50} drawn={drawn} amber={[lone]} lit={[lone, partner]} />
                {drawn >= 1 && <path d={`M${x + 16},${ya}H${x}V${yb}H${x + 16}`} fill="none" stroke={PHOSPHOR} strokeWidth={3} />}
              </g>
            );
          })}
        </svg>
        {show.small.map((n, k) => (
          <div key={n} style={{ position: "absolute", top: 1030, left: k ? 420 : 50, width: 440, textAlign: "center", fontFamily: fonts.pixel, fontSize: 36, color: PHOSPHOR, textShadow: glow }}>
            {`${n} ${hexagrams[n].name.toUpperCase()}`}
          </div>
        ))}
      </>
    );
  }
  if (show.hex === "pair") {
    // A broken line under a solid one, drawn bottom first.
    return (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <Plot lines={[0, 1]} turn={turn} cx={CX - 60} cy={CY + 120} scale={SCALE} drawn={drawn / 3} />
        </svg>
        {drawn >= 1 && (
          <div style={{ position: "absolute", left: 740, top: CY + 120 - lineZ(1) * SCALE - 26, fontFamily: fonts.pixel, fontSize: 40, lineHeight: `${(LINE_H + 0.3) * SCALE}px`, color: PHOSPHOR, textShadow: glow }}>
            <div>YANG</div>
            <div>YIN</div>
          </div>
        )}
      </>
    );
  }
  if (typeof show.hex !== "number") return null;
  const h = hexagrams[show.hex];
  const { lines } = h;
  const lit = show.lit;
  const amber = show.amber ?? [];
  const right = CX + (LINE_W / 2) * SCALE + 60;
  const bracket = (from: number, to: number) => {
    const top = CY - lineZ(to) * SCALE - LINE_H * SCALE;
    const bottom = CY - lineZ(from) * SCALE + LINE_H * SCALE;
    return `M${right - 24},${top}H${right}V${bottom}H${right - 24}`;
  };
  const log = show.log ?? [];
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Plot lines={lines} turn={turn} cx={CX} cy={CY} scale={SCALE} drawn={show.draw ? drawn : 1} lit={lit} amber={amber} />
        {(show.links ?? []).map(([a, b], k) => {
          const x = CX - (LINE_W / 2) * SCALE - 40 - k * 24;
          return <path key={k} d={`M${x + 20},${CY - lineZ(a) * SCALE}H${x}V${CY - lineZ(b) * SCALE}H${x + 20}`} fill="none" stroke={show.blue ? BLUE : PHOSPHOR} strokeWidth={3.4} style={{ filter: `drop-shadow(0 0 6px ${show.blue ? BLUE : PHOSPHOR})` }} />;
        })}
        {show.brackets && [bracket(3, 5), bracket(0, 2)].map((d, k) => <path key={k} d={d} fill="none" stroke={DIM} strokeWidth={3} />)}
        {show.ranks && <path d={bracket(1, 4)} fill="none" stroke={PHOSPHOR} strokeWidth={3} />}
      </svg>
      {show.names && (
        <>
          <div style={{ position: "absolute", left: 120, top: CY - lineZ(5) * SCALE - 110, fontFamily: fonts.pixel, fontSize: 38, color: PHOSPHOR, textShadow: glow }}>{`UPPER ${h.trigrams[0].zh} ${h.trigrams[0].name} · ${DOES[h.trigrams[0].name]}`}</div>
          <div style={{ position: "absolute", left: 120, top: CY - lineZ(0) * SCALE + 50, fontFamily: fonts.pixel, fontSize: 38, color: PHOSPHOR, textShadow: glow }}>{`LOWER ${h.trigrams[1].zh} ${h.trigrams[1].name} · ${DOES[h.trigrams[1].name]}`}</div>
        </>
      )}
      {log.length > 0 && (
        <div style={{ position: "absolute", left: 80, top: 1200 }}>
          {[5, 4, 3, 2, 1, 0].map((i) => {
            if (show.draw && drawn * 6 - i <= 0) return <div key={i} style={{ height: 46 }} />;
            const on = !lit || lit.includes(i) || amber.includes(i);
            return (
              <LogRowView
                key={i}
                i={i}
                yang={lines[i] === 1}
                place={log.includes("place") ? place(lines, i).trim() : ""}
                centre={log.includes("centre") && (i === 1 || i === 4)}
                mark={amber.includes(i)}
                size={36}
                style={() => ({ color: amber.includes(i) ? AMBER : on ? PHOSPHOR : DIM, opacity: on ? 1 : 0.35, glow: on })}
              />
            );
          })}
        </div>
      )}
    </>
  );
};

// The column's values for what the page shows: the hexagram, the line in view, and that
// line's place and centre. The line is inverted when it is amber (the line to look at).
const fieldsOf = (t: Timed | undefined, now: number, hexagrams: Record<string, Hex>): Field[] => {
  const blank = [
    { label: "HEX", value: "--" },
    { label: "LINE", value: "--" },
    { label: "PLACE", value: "--" },
    { label: "CENTRE", value: "--" },
  ];
  if (!t || t.page.chapter || !t.page.show) return blank;
  const show = showAt(t.page.show, (now - t.from - t.aAt) / FPS);
  if (show.small) return [{ label: "HEX", value: show.small.join(" ") }, ...blank.slice(1)];
  if (typeof show.hex !== "number") return blank;
  const { lines } = hexagrams[show.hex];
  const amber = show.amber ?? [];
  const lit = amber.length ? amber : show.lit ?? [];
  const sorted = [...lit].sort();
  const line = !sorted.length ? "--" : sorted.length > 2 ? `L${sorted[0] + 1}-L${sorted[sorted.length - 1] + 1}` : sorted.map((i) => `L${i + 1}`).join(" ");
  const one = sorted.length === 1 ? sorted[0] : undefined;
  const log = show.log ?? [];
  return [
    { label: "HEX", value: String(show.hex) },
    { label: "LINE", value: line, on: amber.length > 0 },
    { label: "PLACE", value: one === undefined || !log.includes("place") ? "--" : place(lines, one).trim() || "NONE" },
    { label: "CENTRE", value: one === undefined || !log.includes("centre") ? "--" : one === 1 || one === 4 ? "YES" : "NO" },
  ];
};

const PageView: React.FC<{ t: Timed; hexagrams: Record<string, Hex>; readouts: Record<string, Full>; now: number; turn: number }> = ({ t, hexagrams, readouts, now, turn }) => {
  const f = now - t.from;
  const { page } = t;
  if (page.chapter) {
    return (
      <div style={{ position: "absolute", top: 860, left: 50, width: 780, textAlign: "center", fontFamily: fonts.pixel, fontSize: 96, color: PHOSPHOR, textShadow: glow }}>
        {page.chapter}
      </div>
    );
  }
  const full = t.fulls.find((x) => f >= x.from && f < x.from + FULL);
  if (full) {
    const r = readouts[full.n];
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <Readout {...r} built />
      </AbsoluteFill>
    );
  }
  const lines = (page.a ?? "").split("\n");
  const sec = (f - t.aAt) / FPS;
  const show = showAt(page.show ?? {}, sec);
  const drawn = interpolate(f, [t.aAt, t.aAt + 1.2 * FPS], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lastLine = t.lineAt[t.lineAt.length - 1] + Math.round(lines[lines.length - 1].length * A_RATE);
  // A page with nothing to draw sets its answer larger, in the middle of the screen.
  const textOnly = Object.keys(page.show ?? {}).length === 0;
  return (
    <>
      <div style={{ position: "absolute", left: 80, right: 280, top: textOnly ? 700 : 310 }}>
        {/* The question: full strength with a light glow, its prompt in cyan, the one cyan on the
            screen (the human side of the inquiry; amber is the line to look at). */}
        <div style={{ display: "flex", fontFamily: fonts.pixel, fontSize: textOnly ? 46 : 40 }}>
          <span style={{ color: CYAN, textShadow: `0 0 6px ${CYAN}`, whiteSpace: "pre" }}>{"> "}</span>
          <Line text={page.q ?? ""} frame={f} at={t.qAt} rate={Q_RATE} size={textOnly ? 46 : 40} color={PHOSPHOR} glowless style={{ textShadow: "0 0 6px rgba(125,255,138,0.6)" }} />
        </div>
        <div style={{ height: textOnly ? 24 : 14 }} />
        {lines.map((l, i) => (
          <Line key={i} text={l} frame={f} at={t.lineAt[i]} rate={A_RATE} size={textOnly ? 58 : 46} cursor={i === lines.length - 1 && f >= lastLine} />
        ))}
      </div>
      <Drawing show={show} hexagrams={hexagrams} turn={turn} drawn={drawn} />
      {show.lesson && f >= lastLine + 15 && (
        <div style={{ position: "absolute", left: 80, right: 280, top: 1520 }}>
          <Line text={show.lesson} frame={f} at={lastLine + 15} rate={A_RATE} size={60} color="#fff" glowless cursor />
        </div>
      )}
    </>
  );
};

export const Lesson: React.FC<LessonProps> = (p) => {
  const now = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { pages, end } = lessonPlan(p);
  const t = pages.find((x) => now >= x.from && now < x.from + x.frames);
  const k = t ? pages.indexOf(t) : 0;
  const chapter = [...pages.slice(0, k + 1)].reverse().find((x) => x.page.chapter)?.page.chapter ?? "WANG BI";
  const asked = pages.filter((x) => !x.page.chapter);
  const n = asked.filter((x) => x.from <= now).length;
  const turn = interpolate(now, [0, end], [-0.5, 0.3]);
  const flicker = 0.94 + 0.06 * random(`flicker-${Math.floor(now / 2)}`);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Soundtrack src={p.music} start={p.musicStart} fadeFrom={durationInFrames - 2 * FPS} />
      {/* The teletype: a tick while the query and each answer line type. */}
      {pages.flatMap((x, k) =>
        x.page.chapter
          ? []
          : [
              { from: x.from + x.qAt, n: Math.round(((x.page.q ?? "").length + 2) * Q_RATE) },
              ...(x.page.a ?? "").split("\n").map((l, i) => ({ from: x.from + x.lineAt[i], n: Math.round(l.length * A_RATE) })),
            ].map((s, i) => (
              <Sequence key={`${k}-${i}`} from={s.from} durationInFrames={Math.max(1, s.n)}>
                <Audio src={staticFile(p.ticks)} volume={0.35} />
              </Sequence>
            )),
      )}
      <Sequence durationInFrames={end}>
        <AbsoluteFill style={{ opacity: flicker }}>
          <Hud
            title={chapter}
            tags={["READY FOR INQUIRY", `PAGE ${String(n).padStart(2, "0")}/${asked.length}`]}
            fields={fieldsOf(t, now, p.hexagrams)}
            now={now}
            cross={{ left: 90, right: 790, top: 620, bottom: 1150 }}
          />
          {t && <PageView t={t} hexagrams={p.hexagrams} readouts={p.readouts} now={now} turn={turn} />}
          <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 5px)", pointerEvents: "none" }} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={end}>
        <EndCard3D clip={p.endcard.clip} />
      </Sequence>
    </AbsoluteFill>
  );
};
