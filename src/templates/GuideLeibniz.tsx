import { C, cue, glow, GuideShort, Hexagram, Label, Line, ngon, Pic, poly, sans, Still, t01, Title, type GuideProps, type Page } from "./guide-kit";

// The Guide entry on Leibniz reading the hexagrams as binary (queued overnight, the user,
// 2026-10-01: "please queue up a few more shorts/and ideas"). Narration and picture notes:
// series/specials/guide-leibniz.json (draft 2, Astra's revision, round 1 converged). Every page
// holds still.

// A value's lines, bottom first, the bottom line the most significant bit (src/lib/cube.ts).
const linesOf = (v: number) => [0, 1, 2, 3, 4, 5].map((i) => (v >> (5 - i)) & 1);
const bits = (v: number) => linesOf(v).join("");
const TEXT = { fontFamily: sans, fontWeight: 800, letterSpacing: 3 } as const;

// The 64 in Shao Yong's square, value v at row v / 8, column v % 8, tiling in from at.
const Square: React.FC<{ f: number; at: number; x: number; y: number; cell: number; c?: string }> = ({ f, at, x, y, cell, c = C.yellow }) => (
  <>
    {Array.from({ length: 64 }, (_, v) =>
      f < at + v * 0.5 ? null : <Hexagram key={v} lines={linesOf(v)} x={x + (v % 8) * cell} y={y + Math.floor(v / 8) * cell} w={cell * 0.62} c={c} />,
    )}
  </>
);

// Line 1: the title; the 64 as an 8×8 grid of small figures.
const Grid: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b1} text="THE I-CHING" />
    <Still>
      <Pic>
        <Square f={f} at={m.b1 + 20} x={210} y={400} cell={84} />
        <Label f={f} at={m.grid} text="64 SITUATIONS" x1={540} y1={1080} x2={540} y2={1130} anchor="middle" />
      </Pic>
    </Still>
  </>
);

// The diagram Bouvet sent: the 64 round a circle, the same 64 in a square inside it.
const Diagram: React.FC<{ f: number; at: number; cx: number; cy: number; r: number }> = ({ f, at, cx, cy, r }) => (
  <>
    <Line f={f} at={at} c={C.yellow} w={5} d={ngon(cx, cy, r, 64)} dur={18} />
    {Array.from({ length: 64 }, (_, k) => {
      const a = (k / 64) * 2 * Math.PI - Math.PI / 2;
      const [x1, y1, x2, y2] = [cx + Math.cos(a) * (r + 8), cy + Math.sin(a) * (r + 8), cx + Math.cos(a) * (r + 34), cy + Math.sin(a) * (r + 34)];
      return f < at + 8 + k * 0.3 ? null : <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.yellow} strokeWidth={6} style={{ filter: glow(C.yellow, 4) }} />;
    })}
    <Square f={f} at={at + 20} x={cx - r * 0.64} y={cy - r * 0.64} cell={(r * 1.3) / 8} />
  </>
);

// Line 2: an envelope from CHINA / 1701 to LEIBNIZ; it opens onto the diagram.
const Letter: Page = ({ f, m }) => {
  const k = t01(f, m.sent, m.china - m.sent);
  const ex = 250 + k * 560, ey = 520 - Math.sin(Math.PI * k) * 60;
  const open = f >= m.china + 6;
  return (
    <>
      <Title f={f} at={m.b2} text="THE LETTER" />
      <Still>
        <Pic>
          <text x={250} y={430} textAnchor="middle" {...TEXT} fontSize={40} fill={C.green} style={{ filter: glow(C.green, 5) }} opacity={t01(f, m.b2 + 8, 4)}>
            <tspan x={250}>CHINA</tspan>
            <tspan x={250} dy={48}>1701</tspan>
          </text>
          <text x={810} y={430} textAnchor="middle" {...TEXT} fontSize={40} fill={C.green} style={{ filter: glow(C.green, 5) }} opacity={t01(f, m.b2 + 14, 4)}>LEIBNIZ</text>
          {!open && f >= m.b2 + 10 && (
            <g opacity={1 - t01(f, m.china, 6)}>
              <Line f={f} at={m.b2 + 10} c={C.white} w={6} d={poly([[ex - 90, ey], [ex + 90, ey], [ex + 90, ey + 120], [ex - 90, ey + 120]])} />
              <Line f={f} at={m.b2 + 16} c={C.white} w={6} d={`M${ex - 90} ${ey} L${ex} ${ey + 66} L${ex + 90} ${ey}`} />
            </g>
          )}
          {open && <Diagram f={f} at={m.china + 6} cx={540} cy={900} r={270} />}
        </Pic>
      </Still>
    </>
  );
};

// Line 3: Leibniz, a wig outline, beside ordinary numbers and the same numbers in binary.
const Binary: Page = ({ f, m }) => {
  const s = m.b3;
  return (
    <>
      <Title f={f} at={s} text="LEIBNIZ" />
      <Still>
        <Pic>
          <Line f={f} at={s + 4} c={C.pink} d={ngon(290, 640, 80, 6, Math.PI / 6)} />
          {/* The wig: three curls down each side. */}
          {[0, 1, 2].flatMap((i) => [
            <Line key={`l${i}`} f={f} at={s + 8 + i * 2} c={C.white} w={7} d={ngon(196, 610 + i * 70, 40, 8)} />,
            <Line key={`r${i}`} f={f} at={s + 8 + i * 2} c={C.white} w={7} d={ngon(384, 610 + i * 70, 40, 8)} />,
          ])}
          <Line f={f} at={s + 12} c={C.pink} d={poly([[200, 820], [380, 820], [440, 1180], [140, 1180]])} fill={`${C.pink}22`} fillAt={s + 26} />
          {[0, 1, 2, 3, 4].map((n) => {
            const at = m.binary + n * 5;
            return (
              <g key={n} opacity={t01(f, at, 3)} style={{ filter: glow(C.yellow, 6) }}>
                <text x={640} y={560 + n * 120} textAnchor="end" {...TEXT} fontSize={72} fill={C.yellow}>{n}</text>
                <text x={740} y={560 + n * 120} {...TEXT} fontSize={72} fill={C.green}>{n.toString(2)}</text>
              </g>
            );
          })}
        </Pic>
      </Still>
    </>
  );
};

// Line 4: LEIBNIZ'S READING, four examples: the figure, its digits (bottom line first), its number.
const EXAMPLES = [
  [0, "broken"],
  [1, "solid"],
  [2, "count"],
  [63, "count"],
] as const;
const Reading: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b4} text="READING" sub="LEIBNIZ'S" />
    <Still>
      <Pic>
        {EXAMPLES.map(([v, mark], k) => {
          const at = m[mark] + (k === 3 ? 24 : 0);
          if (f < at) return null;
          const y = 360 + k * 215;
          return (
            <g key={v} opacity={t01(f, at, 4)}>
              <Hexagram lines={linesOf(v)} x={120} y={y} w={170} c={C.yellow} />
              <text x={360} y={y + 120} {...TEXT} fontSize={64} fill={C.green} style={{ filter: glow(C.green, 6) }}>{`${bits(v)} = ${v}`}</text>
            </g>
          );
        })}
        <text x={540} y={1260} textAnchor="middle" {...TEXT} fontSize={36} fill={C.green} style={{ filter: glow(C.green, 5) }} opacity={t01(f, m.broken + 10, 4)}>DIGITS: BOTTOM LINE FIRST</text>
      </Pic>
    </Still>
  </>
);

// Line 5: the paper, WRITTEN 1703; then who he credited.
const Paper: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b5} text="THE PAPER" />
    <Still>
      <Pic>
        <Line f={f} at={m.b5 + 4} c={C.white} w={6} d={poly([[300, 420], [720, 420], [780, 480], [780, 1120], [300, 1120]])} fill={`${C.white}11`} fillAt={m.b5 + 18} />
        {[0, 1, 2, 3, 4, 5].map((i) => <Line key={i} f={f} at={m.b5 + 10 + i * 2} c={`${C.white}66`} w={4} d={`M350 ${760 + i * 50} L730 ${760 + i * 50}`} dur={8} />)}
        <text x={540} y={560} textAnchor="middle" {...TEXT} fontSize={44} fill={C.yellow} style={{ filter: glow(C.yellow, 6) }} opacity={t01(f, m.b5 + 14, 4)}>
          <tspan x={540}>BINARY</tspan>
          <tspan x={540} dy={54}>ARITHMETIC</tspan>
          <tspan x={540} dy={70} fontSize={34}>WRITTEN 1703</tspan>
        </text>
        <Label f={f} at={m.fuxi} text={"FIGURES: FU XI\n(LEGEND)"} x1={780} y1={900} x2={830} y2={1180} anchor="middle" />
      </Pic>
    </Still>
  </>
);

// Line 6: the diagram again, still; the attribution.
const Order: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b6} text="THE ORDER" />
    <Still>
      <Pic>
        <Diagram f={f} at={-999} cx={540} cy={760} r={270} />
        <Label f={f} at={m.shao} text={"ORDER: ATTRIBUTED TO\nSHAO YONG · 1011–1077"} x1={540} y1={1070} x2={540} y2={1130} anchor="middle" />
      </Pic>
    </Still>
  </>
);

// Line 7: the summary; one column of the count, 0 to 4, beside it.
const Summary: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b7} text="SUMMARY" />
    <Still>
      <Pic>
        {[0, 1, 2, 3].map((n) => (
          <text key={n} x={540 + (n - 1.5) * 200} y={1180} textAnchor="middle" {...TEXT} fontSize={64} fill={C.green} style={{ filter: glow(C.green, 6) }} opacity={t01(f, m.b7 + 30 + n * 5, 3)}>
            {n.toString(2).padStart(2, "0")}
          </text>
        ))}
      </Pic>
    </Still>
  </>
);

const PAGES: [string, Page][] = [["b1", Grid], ["b2", Letter], ["b3", Binary], ["b4", Reading], ["b5", Paper], ["b6", Order], ["b7", Summary]];

export const GuideLeibniz: React.FC<GuideProps> = (props) => (
  <GuideShort
    {...props}
    pages={PAGES}
    summary={7}
    cues={(m) => (
      <>
        {Array.from({ length: 8 }, (_, r) => cue("blip-droplet", m.b1 + 20 + r * 4, 0.16))}
        {[m.grid, m.shao, m.fuxi, m.broken + 10].map((t) => cue("blip-hi", t, 0.18))}
        {cue("whoosh-up", m.sent, 0.18)}
        {cue("chime-page", m.china + 6, 0.2)}
        {[0, 1, 2, 3, 4].map((n) => cue("tick-key", m.binary + n * 5, 0.2))}
        {EXAMPLES.map(([, mark], k) => cue("blip-pluck", m[mark] + (k === 3 ? 24 : 0), 0.2))}
        {cue("chime-ding", m.delighted, 0.2)}
        {cue("blip-up", m.not - 8, 0.2)}
        {cue("error-buzz", m.e7 + 6, 0.16)}
      </>
    )}
  />
);
