import { AbsoluteFill, Audio, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Grain } from "../fx/Glitch";
import { Soundtrack } from "../fx/Soundtrack";
import { fonts } from "../lib/fonts";
import { EndCard3D, type EndCardText } from "../scenes/EndCard3D";
import { CAM_FAR, camEnd, descended, flightCam, FlightPlot, type Cam, type CamStart } from "../scenes/Flight";
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
  brackets?: boolean;
  names?: boolean;
  ranks?: boolean;
  big?: string;
  lesson?: string;
  full?: { n: number; after: number }[];
  then?: ({ after: number } & Show)[];
  // The flight look (src/scenes/Flight.tsx): seconds of approach, while the lines plot, before
  // the query is typed; the line to go down to once the answer starts; seconds to hold.
  approach?: number;
  fly?: number;
  hold?: number;
};
type Page = { chapter?: string; q?: string; a?: string; show?: Show };
type Full = { number: number; name: string; lines: (0 | 1)[]; trigrams: [Trigram, Trigram]; text: string; mark?: number[]; finding?: string; master?: { zh: string; en: string } };
export type LessonProps = {
  pages: Page[];
  hexagrams: Record<string, Hex>;
  readouts: Record<string, Full>;
  music: string | null;
  musicStart: number;
  ticks: string;
  // `text`: the clip has no tagline or site and EndCard3D draws them (src/scenes/EndCard3D.tsx).
  endcard: { clip: string; seconds: number; rate?: number; text?: EndCardText };
  // The music only for the end card, its `at` second landing on the cut, faded in over `lead`
  // seconds as the machine sounds fall away.
  endMusic?: { at: number; lead: number };
  // "flight": the view moves through the hexagram, the screen is a tube pushed in on slowly,
  // and the sound is a machine's: a hum, a relay click per line plotted, a printer while an
  // answer types (docs/research/2026-09-27-nostromo-screens.md).
  look?: "flight";
  sfx?: { hum: string; beacon?: string; relay: string; printer: string; sweep?: string; chatter?: string; warble?: string; winddown?: string };
  // Volumes (0..1) of the music and each sound, where a script sets them.
  mix?: { music?: number; hum?: number; beacon?: number; relay?: number; printer?: number; ticks?: number; sweep?: number; chatter?: number; warble?: number; winddown?: number; musicUp?: ("start" | "chapters" | "end")[] };
};

const FPS = 30;
const Q_RATE = 1.1; // frames per character
const A_RATE = 0.9;
const FULL = 4 * FPS;
const CHAPTER = Math.round(1.5 * FPS);

// Each page's timeline: the query typed, then each answer line in turn, with any cut to a
// full readout after a given line, then a hold long enough to read it.
// `cam` is the flight camera's state as the page starts, carried from the pages before it.
type Timed = { page: Page; from: number; frames: number; qAt: number; aAt: number; lineAt: number[]; fulls: { n: number; from: number }[]; cam: CamStart };
export const lessonPlan = (p: LessonProps): { pages: Timed[]; end: number } => {
  let t = 0;
  let cam = CAM_FAR;
  const pages = p.pages.map((page) => {
    const from = t;
    if (page.chapter) {
      t += CHAPTER;
      return { page, from, frames: CHAPTER, qAt: 0, aAt: 0, lineAt: [], fulls: [], cam };
    }
    const q = page.q ?? "";
    const lines = (page.a ?? "").split("\n");
    const qAt = 10 + Math.round((page.show?.approach ?? 0) * FPS);
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
    const hold = page.show?.hold !== undefined ? page.show.hold * FPS : Math.max(2.5, words / 3.7) * FPS + (page.show?.draw ? FPS : 0);
    const frames = Math.max(Math.round(3.5 * FPS), (fulls.length ? at - aAt : at) + Math.round(fulls.length ? FPS : hold));
    t += frames;
    const timed = { page, from, frames, qAt, aAt, lineAt, fulls, cam };
    if (typeof page.show?.hex === "number") cam = camEnd({ approach: page.show.approach ?? 0, descendAt: aAt / FPS, to: page.show.fly, end: frames / FPS, start: cam });
    return timed;
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

const Frame: React.FC<{ now: number }> = ({ now }) => (
  <>
    <div style={{ position: "absolute", inset: "150px 50px 200px", border: `3px solid ${DIM}`, boxShadow: "inset 0 0 40px rgba(125,255,138,0.08)" }} />
    <div style={{ position: "absolute", left: 50, right: 50, top: 150, height: 90, borderBottom: `3px solid ${DIM}` }} />
    <div style={{ position: "absolute", left: 80, top: 172, fontFamily: fonts.pixel, fontSize: 44, color: PHOSPHOR, textShadow: glow }}>SIX LINES // READY FOR INQUIRY</div>
    <div style={{ position: "absolute", right: 80, top: 250, fontFamily: fonts.pixel, fontSize: 26, color: DIM }}>{`SYS ${(76.75 + ((now * 7.31) % 23)).toFixed(2)}`}</div>
  </>
);

const CX = 540;
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

const Drawing: React.FC<{ show: Show; hexagrams: Record<string, Hex>; turn: number; drawn: number; cam?: Cam; logFade?: number }> = ({ show, hexagrams, turn, drawn, cam, logFade = 1 }) => {
  if (show.big) {
    const [top, under] = show.big.split("\n");
    return (
      <div style={{ position: "absolute", top: 640, left: 0, right: 0, textAlign: "center", color: AMBER, textShadow: `0 0 14px ${AMBER}` }}>
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
            const cx = k ? 780 : 300;
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
          <div key={n} style={{ position: "absolute", top: 1030, left: k ? 560 : 80, width: 440, textAlign: "center", fontFamily: fonts.pixel, fontSize: 36, color: PHOSPHOR, textShadow: glow }}>
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
          <div style={{ position: "absolute", left: 830, top: CY + 120 - lineZ(1) * SCALE - 26, fontFamily: fonts.pixel, fontSize: 40, lineHeight: `${(LINE_H + 0.3) * SCALE}px`, color: PHOSPHOR, textShadow: glow }}>
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
        {cam ? (
          <FlightPlot lines={lines} cam={cam} cx={CX} cy={CY + 40} drawn={show.draw ? drawn : 1} lit={lit} amber={amber} />
        ) : (
          <Plot lines={lines} turn={turn} cx={CX} cy={CY} scale={SCALE} drawn={show.draw ? drawn : 1} lit={lit} amber={amber} />
        )}
        {!cam && (show.links ?? []).map(([a, b], k) => {
          const x = CX - (LINE_W / 2) * SCALE - 40 - k * 24;
          return <path key={k} d={`M${x + 20},${CY - lineZ(a) * SCALE}H${x}V${CY - lineZ(b) * SCALE}H${x + 20}`} fill="none" stroke={PHOSPHOR} strokeWidth={3.4} style={{ filter: `drop-shadow(0 0 6px ${PHOSPHOR})` }} />;
        })}
        {!cam && show.brackets && [bracket(3, 5), bracket(0, 2)].map((d, k) => <path key={k} d={d} fill="none" stroke={DIM} strokeWidth={3} />)}
        {!cam && show.ranks && <path d={bracket(1, 4)} fill="none" stroke={PHOSPHOR} strokeWidth={3} />}
      </svg>
      {show.names && (
        <>
          <div style={{ position: "absolute", left: 120, top: CY - lineZ(5) * SCALE - 110, fontFamily: fonts.pixel, fontSize: 38, color: PHOSPHOR, textShadow: glow }}>{`UPPER ${h.trigrams[0].zh} ${h.trigrams[0].name} · ${DOES[h.trigrams[0].name]}`}</div>
          <div style={{ position: "absolute", left: 120, top: CY - lineZ(0) * SCALE + 50, fontFamily: fonts.pixel, fontSize: 38, color: PHOSPHOR, textShadow: glow }}>{`LOWER ${h.trigrams[1].zh} ${h.trigrams[1].name} · ${DOES[h.trigrams[1].name]}`}</div>
        </>
      )}
      {log.length > 0 && (
        <div style={{ position: "absolute", left: 80, top: 1200, opacity: logFade }}>
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

const PageView: React.FC<{ t: Timed; hexagrams: Record<string, Hex>; readouts: Record<string, Full>; now: number; turn: number; flight?: boolean }> = ({ t, hexagrams, readouts, now, turn, flight }) => {
  const f = now - t.from;
  const { page } = t;
  if (page.chapter) {
    return (
      <div style={{ position: "absolute", top: 860, left: 0, right: 0, textAlign: "center", fontFamily: fonts.pixel, fontSize: 96, color: PHOSPHOR, textShadow: glow }}>
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
  const approach = page.show?.approach ?? 0;
  const drawn = approach
    ? interpolate(f, [10, t.qAt - 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : interpolate(f, [t.aAt, t.aAt + 1.2 * FPS], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cam = flight && typeof show.hex === "number" ? flightCam(f / FPS, { approach, descendAt: t.aAt / FPS, to: show.fly, end: t.frames / FPS, start: t.cam }) : undefined;
  // The log fades as the camera goes down to its line, and stays out while it is down.
  const logFade = !cam ? 1 : show.fly !== undefined ? 1 - descended(f / FPS, t.aAt / FPS) : 1 - t.cam.down;
  const lastLine = t.lineAt[t.lineAt.length - 1] + Math.round(lines[lines.length - 1].length * A_RATE);
  // A page with nothing to draw sets its answer larger, in the middle of the screen.
  const textOnly = Object.keys(page.show ?? {}).length === 0;
  return (
    <>
      <div style={{ position: "absolute", left: 80, right: 80, top: textOnly ? 700 : 290 }}>
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
      <Drawing show={show} hexagrams={hexagrams} turn={turn} drawn={drawn} cam={cam} logFade={logFade} />
      {show.lesson && f >= lastLine + 15 && (
        <div style={{ position: "absolute", left: 80, right: 80, top: 1520 }}>
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
  const turn = interpolate(now, [0, end], [-0.5, 0.3]);
  const flicker = 0.94 + 0.06 * random(`flicker-${Math.floor(now / 2)}`);
  // The music under the machine sounds, at `mix.music`, up to full at the edges: the first
  // 3 s, the chapter pages and the end card (as Alien's score gives way to the ship's hum).
  const base = p.mix?.music ?? (p.look === "flight" ? 0.6 : 1);
  // `mix.musicUp` picks the edges; "end" alone keeps the music for the end card.
  const edges = p.mix?.musicUp ?? ["start", "chapters", "end"];
  const up = [
    ...(edges.includes("start") ? [[0, 3 * FPS]] : []),
    ...(edges.includes("chapters") ? pages.filter((x) => x.page.chapter).map((x) => [x.from, x.from + x.frames]) : []),
    ...(edges.includes("end") ? [[end, durationInFrames]] : []),
  ];
  const musicLevel = (fr: number) => {
    if (base >= 1) return 1;
    const near = Math.max(0, ...up.map(([a, b]) => (fr >= a && fr < b ? 1 : fr < a ? Math.max(0, 1 - (a - fr) / FPS) : Math.max(0, 1 - (fr - b) / (1.5 * FPS)))));
    return base + (1 - base) * near;
  };
  // With `endMusic` the machine sounds fall away under the music's lead-in, to a faint trace.
  const machines = (fr: number) => (p.endMusic ? interpolate(fr, [end - p.endMusic.lead * FPS, end], [1, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {p.endMusic && p.music ? (
        <Sequence from={end - Math.round(p.endMusic.lead * FPS)}>
          <Audio
            src={staticFile(p.music)}
            trimBefore={Math.round((p.endMusic.at - p.endMusic.lead) * FPS)}
            volume={(f) => {
              const lead = p.endMusic!.lead * FPS;
              const last = durationInFrames - end + lead;
              return interpolate(f, [0, lead], [0.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) }) * interpolate(f, [last - 2 * FPS, last], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            }}
          />
        </Sequence>
      ) : (
        <Soundtrack src={p.music} start={p.musicStart} fadeFrom={durationInFrames - 2 * FPS} volume={musicLevel} />
      )}
      {p.look === "flight" && p.sfx && (
        <>
          <Audio src={staticFile(p.sfx.hum)} loop volume={(f) => (p.mix?.hum ?? 0.55) * machines(f)} />
          {/* The beacon, as in the Nostromo's landing: a steady beep that rises through a flight page. */}
          {p.sfx.beacon &&
            pages.flatMap((x, k) =>
              x.page.show?.approach
                ? [
                    <Sequence key={`beacon-${k}`} from={x.from} durationInFrames={x.frames}>
                      <Audio src={staticFile(p.sfx!.beacon!)} volume={(f) => (p.mix?.beacon ?? 1) * interpolate(f, [0, FPS, x.frames - FPS, x.frames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
                    </Sequence>,
                  ]
                : [],
            )}
          {/* A relay click as each line is plotted during the approach, or, with `sfx.chatter`, a
              relay bank's chatter all through it. Then the boot sequence's other sounds at their
              moments (docs/research/nostromo-boot-inventory.json): a sweep as the view starts, a
              warble as the camera reaches its line, a wind-down as the lesson's last answer stops
              typing. Each page gets the cues for what its camera does. */}
          {pages.flatMap((x, k) => {
            const s = p.sfx!;
            const lines = (x.page.a ?? "").split("\n");
            const typed = x.lineAt[lines.length - 1] + Math.round(lines[lines.length - 1].length * A_RATE);
            const last = x === [...pages].reverse().find((y) => !y.page.chapter);
            const cues: { key: string; from: number; frames: number; src?: string; volume: number }[] = [
              ...(x.page.show?.approach
                ? [
                    ...(s.chatter
                      ? [{ key: "chatter", from: 10, frames: x.qAt - 20, src: s.chatter, volume: p.mix?.chatter ?? 0.7 }]
                      : [0, 1, 2, 3, 4, 5].map((i) => ({ key: `relay-${i}`, from: 10 + Math.round(((x.qAt - 20) * i) / 6), frames: 10, src: s.relay, volume: p.mix?.relay ?? 0.8 }))),
                    { key: "sweep", from: 0, frames: FPS, src: s.sweep, volume: p.mix?.sweep ?? 0.7 },
                  ]
                : []),
              ...(x.page.show?.fly !== undefined ? [{ key: "warble", from: x.aAt + 4 * FPS, frames: Math.round(1.5 * FPS), src: s.warble, volume: p.mix?.warble ?? 0.5 }] : []),
              ...(last && !x.page.chapter ? [{ key: "winddown", from: typed, frames: Math.round(2.3 * FPS), src: s.winddown, volume: p.mix?.winddown ?? 0.6 }] : []),
            ];
            return cues
              .filter((c) => c.src)
              .map((c) => (
                <Sequence key={`${c.key}-${k}`} from={x.from + c.from} durationInFrames={c.frames}>
                  <Audio src={staticFile(c.src!)} volume={c.volume} />
                </Sequence>
              ));
          })}
        </>
      )}
      {/* The teletype: a tick while the query types, and each answer line (a printer's chatter
          in the flight look). */}
      {pages.flatMap((x, k) =>
        x.page.chapter
          ? []
          : [
              { from: x.from + x.qAt, n: Math.round(((x.page.q ?? "").length + 2) * Q_RATE), src: p.ticks },
              ...(x.page.a ?? "").split("\n").map((l, i) => ({ from: x.from + x.lineAt[i], n: Math.round(l.length * A_RATE), src: p.look === "flight" && p.sfx ? p.sfx.printer : p.ticks })),
            ].map((s, i) => (
              <Sequence key={`${k}-${i}`} from={s.from} durationInFrames={Math.max(1, s.n)}>
                <Audio src={staticFile(s.src)} volume={s.src === p.ticks ? p.mix?.ticks ?? 0.35 : p.mix?.printer ?? 0.35} />
              </Sequence>
            )),
      )}
      <Sequence durationInFrames={end}>
        {/* In the flight look the screen is a tube the camera pushes in on, slowly. */}
        <AbsoluteFill style={{ opacity: flicker, transform: p.look === "flight" ? `scale(${interpolate(now, [0, end], [1, 1.07])}) translateY(${interpolate(now, [0, end], [0, -18])}px)` : undefined }}>
          <Frame now={now} />
          {t && <PageView t={t} hexagrams={p.hexagrams} readouts={p.readouts} now={now} turn={turn} flight={p.look === "flight"} />}
          <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 5px)", pointerEvents: "none" }} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={end}>
        <EndCard3D clip={p.endcard.clip} rate={p.endcard.rate} text={p.endcard.text} />
      </Sequence>
      {/* Film grain, scan lines and dark corners over everything, the end card too, as in the shorts. */}
      <Grain />
    </AbsoluteFill>
  );
};
