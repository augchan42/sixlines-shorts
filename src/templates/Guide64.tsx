import { barY, C, Camera, cue, DrawnHexagram, eased, glow, GuideShort, Label, lerp, Line, ngon, Pic, poly, sans, Small, Still, t01, Title, type GuideProps, type P, type Page } from "./guide-kit";

// The Guide entry on hexagram 64, the book's last: Before Completion (the user, 2026-10-01: "i think
// some hitchhikers shorts would be great ... review and converge with astra then execute").
// Narration and picture notes: series/specials/guide-64.json (draft 2, Astra's revision, round 1
// converged). One camera move (the push toward the fox); the other pages hold still.

const H63 = [1, 0, 1, 0, 1, 0];
const H64 = [0, 1, 0, 1, 0, 1];
const HX = 330, HY = 680, HW = 420;

// Line 1: the 64 as a grid of squares, the 63rd lit; then 63 drawn large, a tick at each line.
const Entry63: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b1} text="THE I-CHING" />
    <Still>
      <Pic>
        {Array.from({ length: 64 }, (_, i) => {
          const at = m.b1 + 20 + i * 0.5;
          if (f < at) return null;
          const lit = i === 62 && f >= m.h63;
          return <rect key={i} x={306 + (i % 8) * 60} y={330 + Math.floor(i / 8) * 34} width={44} height={22} fill={lit ? C.yellow : f < at + 2 ? C.white : `${C.blue}aa`} style={lit ? { filter: glow(C.yellow, 8) } : undefined} />;
        })}
        <Small f={f} at={m.situations} x={540} y={640} text="64 SITUATIONS" anchor="middle" />
        <DrawnHexagram f={f} at={m.h63 + 6} lines={H63} x={HX} y={HY} w={HW} c={C.yellow} />
        <Ticks f={f} at={m.h63 + 16} />
        <Label f={f} at={m.across63} text="既濟 AFTER COMPLETION" x1={540} y1={1110} x2={540} y2={1160} anchor="middle" />
      </Pic>
    </Still>
  </>
);

// A green tick beside each line of 63: every line in its proper place. They dim on "disorder".
const Ticks: React.FC<{ f: number; at: number; dim?: number }> = ({ f, at, dim }) => (
  <g opacity={dim === undefined ? 1 : lerp(1, 0.35, t01(f, dim, 20))}>
    {H63.map((_, i) => {
      const y = barY(HY, HW, i) + HW * 0.055;
      return <Line key={i} f={f} at={at + i * 4} c={C.green} w={7} d={`M${HX + HW + 40} ${y} L${HX + HW + 58} ${y + 18} L${HX + HW + 92} ${y - 20}`} dur={6} />;
    })}
  </g>
);

// Line 2: the same diagram, the Judgment's warning on a label; the ticks dim on "disorder".
const Warns: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b1 - 999} text="THE I-CHING" />
    <Still>
      <Pic>
        <DrawnHexagram f={f} at={-999} lines={H63} x={HX} y={HY} w={HW} c={C.yellow} />
        <Ticks f={f} at={-999} dim={m.disorder} />
        <Label f={f} at={-999} text="既濟 AFTER COMPLETION" x1={540} y1={1110} x2={540} y2={1160} anchor="middle" />
        {/* Above the diagram, no leader: a Label's text hangs below its line, which would cross it. */}
        {f >= m.warns && (
          <text x={540} y={430} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={38} letterSpacing={3} fill={C.green} style={{ filter: glow(C.green, 5) }}>
            {["初吉終亂", "GOOD AT FIRST,", "DISORDER AT THE END"].map((t, i) => <tspan key={i} x={540} dy={i ? 50 : 0}>{t}</tspan>)}
          </text>
        )}
      </Pic>
    </Still>
  </>
);

// Line 3: the device at entry 63 starts to close, then opens again at 64.
const Device: Page = ({ f, m }) => {
  const shut = eased(f, m.stop - 4, m.stop + 14) * (1 - eased(f, m.e3 + 4, m.e3 + 18));
  const n = f < m.e3 + 10 ? 63 : 64;
  return (
    <>
      <Title f={f} at={m.b3} text="THE I-CHING" />
      <Still>
        <Pic>
          <Line f={f} at={m.b3} c={C.pink} d={poly([[250, 420], [830, 420], [830, 1180], [250, 1180]])} />
          <g transform={`translate(540 800) scale(1 ${1 - shut * 0.85}) translate(-540 -800)`}>
            <rect x={300} y={470} width={480} height={660} fill={`${C.blue}33`} stroke={C.blue} strokeWidth={6} style={{ filter: glow(C.blue, 6) }} />
            <text x={540} y={760} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={60} letterSpacing={4} fill={C.green} style={{ filter: glow(C.green, 6) }}>ENTRY</text>
            <text x={540} y={930} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={200} fill={n === 64 ? C.yellow : C.green} style={{ filter: glow(n === 64 ? C.yellow : C.green, 10) }}>{n}</text>
          </g>
        </Pic>
      </Still>
    </>
  );
};

// Line 4: 64 drawn small, top right; a river, the far bank on the right; a small fox in the water
// short of the bank, its tail dipping on "tail". The camera pushes slowly toward the fox.
const FOX: P[] = [[0, 40], [40, 10], [70, 20], [96, 0], [104, 28], [128, 40], [100, 58], [30, 62]];
const Fox: Page = ({ f, m }) => {
  const dip = eased(f, m.tail, m.tail + 14);
  const fx = 430, fy = 930, k = 1.8;
  return (
    <>
      <Title f={f} at={m.b4} text="BEFORE COMPLETION" zh="未濟" />
      <Camera f={f} a={m.fox} b={m.e4 - 10} from={{ s: 1 }} to={{ s: 1.12 }} ox={600} oy={960}>
        <Pic>
          <DrawnHexagram f={f} at={m.h64} lines={H64} x={740} y={330} w={200} c={C.yellow} step={3} />
          <Label f={f} at={m.h64 + 18} text={"64"} x1={740} y1={420} x2={680} y2={410} anchor="end" />
          {/* The water: three wavy lines; the far bank a green slope on the right. */}
          {[0, 1, 2].map((k) => (
            <Line key={k} f={f} at={m.b4 + 8 + k * 4} c={C.blue} w={6} d={`M60 ${960 + k * 90} ${Array.from({ length: 9 }, (_, i) => `L${120 + i * 90} ${960 + k * 90 + (i % 2 ? -18 : 18)}`).join(" ")}`} />
          ))}
          <Line f={f} at={m.b4 + 12} c={C.green} d={poly([[860, 1240], [880, 900], [1080, 820], [1080, 1240]])} fill={`${C.green}33`} fillAt={m.b4 + 28} />
          {/* The fox, head toward the bank; its tail a triangle behind, dipping into the water. */}
          <Line f={f} at={m.fox} c={C.orange} d={poly(FOX.map(([x, y]) => [fx + x * k, fy + (y - 50) * k] as P))} fill={`${C.orange}55`} fillAt={m.fox + 14} />
          <Line f={f} at={m.fox + 6} c={C.orange} d={poly([[fx + 6, fy - 10], [fx - 150, fy - 70 + dip * 120], [fx - 100, fy + 20 + dip * 60]])} fill={`${C.orange}55`} fillAt={m.fox + 20} />
          <Label f={f} at={m.tail + 10} text="TAIL: WET" x1={fx - 110} y1={fy + 40} x2={260} y2={1140} anchor="middle" />
        </Pic>
      </Camera>
    </>
  );
};

// Line 5: the page counter at 64 / 64; the Sequence's reason; a cursor blinks under the last entry.
const Sequence: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b5} text="BEFORE COMPLETION" zh="未濟" />
    <Still>
      <Pic>
        <text x={540} y={560} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={150} letterSpacing={6} fill={C.yellow} style={{ filter: glow(C.yellow, 10) }} opacity={t01(f, m.b5 + 4, 4)}>64 / 64</text>
        <Label f={f} at={m.commentary} text={"序卦 SEQUENCE OF\nTHE HEXAGRAMS"} x1={540} y1={600} x2={540} y2={680} anchor="middle" />
        <Label f={f} at={m.end - 10} text={"物不可窮也\nTHINGS CANNOT\nCOME TO AN END"} x1={540} y1={800} x2={540} y2={870} anchor="middle" />
        {f >= m.notyet && Math.floor((f - m.notyet) / 12) % 2 === 0 && <rect x={510} y={1150} width={60} height={14} fill={C.white} style={{ filter: glow(C.white, 6) }} />}
      </Pic>
    </Still>
  </>
);

// Line 6: a person looks at a circle, a triangle and a square, then puts each in its matching
// space.
const Sort: Page = ({ f, m }) => {
  const go = (k: number) => eased(f, m.put + k * 8, m.put + k * 8 + 22);
  const from: P[] = [[260, 620], [540, 600], [820, 620]];
  const to: P[] = [[820, 1040], [260, 1040], [540, 1040]];
  const at = (k: number): P => [lerp(from[k][0], to[k][0], go(k)), lerp(from[k][1], to[k][1], go(k)) - Math.sin(Math.PI * go(k)) * 120];
  const shape = (k: number, [x, y]: P, c: string, w = 9) =>
    k === 0 ? ngon(x, y, 70, 20) : k === 1 ? poly([[x, y - 70], [x + 75, y + 60], [x - 75, y + 60]]) : poly([[x - 62, y - 62], [x + 62, y - 62], [x + 62, y + 62], [x - 62, y + 62]]);
  return (
    <>
      <Title f={f} at={m.b6} text="THE ADVICE" />
      <Still>
        <Pic>
          {/* The three spaces, drawn dim: a square, a circle, a triangle. */}
          {[2, 0, 1].map((k, i) => <Line key={k} f={f} at={m.b6 + 6 + i * 3} c={`${C.white}66`} w={5} d={shape(k, to[k], "")} />)}
          <Line f={f} at={m.b6 + 14} c={C.white} w={5} d="M120 1160 L960 1160" />
          {[C.pink, C.yellow, C.mint].map((c, k) => <Line key={k} f={f} at={m.b6 + 10 + k * 4} c={c} d={shape(k, at(k), c)} fill={`${c}44`} fillAt={m.b6 + 26} />)}
        </Pic>
      </Still>
    </>
  );
};

const Summary: Page = ({ f, m }) => <Title f={f} at={m.b7} text="SUMMARY" />;

const PAGES: [string, Page][] = [["b1", Entry63], ["b2", Warns], ["b3", Device], ["b4", Fox], ["b5", Sequence], ["b6", Sort], ["b7", Summary]];

export const Guide64: React.FC<GuideProps> = (props) => (
  <GuideShort
    {...props}
    pages={PAGES}
    summary={7}
    cues={(m) => (
      <>
        {Array.from({ length: 8 }, (_, r) => cue("blip-droplet", m.b1 + 20 + r * 4, 0.16))}
        {[m.situations, m.across63, m.warns, m.commentary, m.end - 10].map((t) => cue("blip-hi", t, 0.18))}
        {Array.from({ length: 6 }, (_, i) => cue("tick-key", m.h63 + 16 + i * 4, 0.2))}
        {cue("blip-down", m.disorder, 0.18)}
        {cue("slide", m.stop - 4, 0.2)}
        {cue("chime-page", m.e3 + 6, 0.22)}
        {cue("blip-droplet", m.tail + 6, 0.28)}
        {[0, 1, 2].map((k) => cue("blip-wood", m.put + k * 8 + 22, 0.26))}
        {cue("blip-up", m.not - 8, 0.2)}
        {cue("error-buzz", m.e7 + 6, 0.16)}
      </>
    )}
  />
);
