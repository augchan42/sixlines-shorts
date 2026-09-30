import { C, Camera, cue, glow, GuideShort, Label, Line, ngon, Pic, poly, sans, Small, Still, t01, Title, type GuideProps, type Page } from "./guide-kit";

// The Guide entry on Confucius reading the I-Ching until the cords of his bamboo strips broke
// three times, 韋編三絕 (the user, 2026-10-01: "i think some hitchhikers shorts would be great ...
// review and converge with astra then execute"). Narration and picture notes:
// series/specials/guide-cords.json (draft 2, Astra's revision, round 1 converged). One camera move
// (the push toward the cords); the other pages hold still.

// A closed book, as an outline with a spine, at (x, y), w wide.
const BookShape: React.FC<{ f: number; at: number; x: number; y: number; w: number; h: number; c?: string }> = ({ f, at, x, y, w, h, c = C.yellow }) => (
  <>
    <Line f={f} at={at} c={c} d={poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]])} fill={`${c}33`} fillAt={at + 16} />
    <Line f={f} at={at + 6} c={c} w={6} d={`M${x + w * 0.12} ${y} L${x + w * 0.12} ${y + h}`} />
  </>
);

// Line 1: the title and a book; its character with English.
const Book: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b1} text="THE I-CHING" />
    <Still>
      <Pic>
        <BookShape f={f} at={m.b1 + 10} x={380} y={520} w={320} h={440} />
        <Label f={f} at={m.book} text="易 CHANGE" x1={700} y1={740} x2={840} y2={880} anchor="middle" />
      </Pic>
    </Still>
  </>
);

// Line 2: Confucius, grey-bearded, beside the book; the source in small print.
const Confucius: Page = ({ f, m }) => {
  const s = m.b2;
  return (
    <>
      <Title f={f} at={s} text="CONFUCIUS" zh="孔子" />
      <Still>
        <Pic>
          <Line f={f} at={s + 4} c={C.pink} d={ngon(400, 560, 90, 6, Math.PI / 6)} />
          {/* A topknot, and a long beard. */}
          <Line f={f} at={s + 8} c={C.pink} w={7} d={poly([[380, 460], [420, 460], [410, 420], [390, 420]])} />
          <Line f={f} at={s + 10} c={C.white} d={poly([[340, 610], [460, 610], [440, 760], [400, 820], [360, 760]])} fill={`${C.white}44`} fillAt={s + 24} />
          <Line f={f} at={s + 12} c={C.pink} d={poly([[300, 700], [500, 700], [560, 1180], [240, 1180]])} fill={`${C.pink}22`} fillAt={s + 28} />
          <BookShape f={f} at={s + 16} x={640} y={820} w={200} h={260} />
          {f >= m.historian && <Small f={f} at={m.historian} x={540} y={1260} text="SOURCE: SIMA QIAN'S ACCOUNT (c. 90 BC)" anchor="middle" />}
        </Pic>
      </Still>
    </>
  );
};

// Line 3: bamboo strips on two leather cords; the top cord breaks and is retied, three times, a
// counter keeping score. The camera pushes slowly toward the strips.
const STRIPS = 11;
const Strips: Page = ({ f, m }) => {
  const breaks = [m.wore + 4, Math.round((m.wore + m.three) / 2), m.three + 4];
  const n = breaks.filter((b) => f >= b).length;
  const last = breaks[n - 1];
  const open = n > 0 && f < last + 12; // the cord hangs broken for 12 frames, then is retied
  const cordY = [560, 960];
  return (
    <>
      <Title f={f} at={m.b3} text="THE CORDS" zh="韋編" />
      <text x={990} y={400} textAnchor="end" fontFamily={sans} fontWeight={800} fontSize={40} letterSpacing={3} fill={C.green} style={{ filter: glow(C.green, 5) }} opacity={f >= m.wore ? 1 : 0}>
        {`BROKEN: ${n}`}
      </text>
      <Camera f={f} a={m.b3 + 10} b={m.e3} from={{ s: 1 }} to={{ s: 1.08 }} ox={540} oy={760}>
        <Pic>
          {Array.from({ length: STRIPS }, (_, i) => (
            <Line key={i} f={f} at={m.b3 + i * 1.5} c={C.mint} w={6} d={poly([[196 + i * 64, 460], [240 + i * 64, 460], [240 + i * 64, 1080], [196 + i * 64, 1080]])} fill={`${C.mint}33`} fillAt={m.strips} dur={8} />
          ))}
          {cordY.map((y, k) =>
            k === 0 && open ? (
              <g key={k}>
                {/* Broken: the two ends hang down either side of the middle. */}
                <Line f={f} at={-999} c={C.orange} w={8} d={`M160 ${y} L500 ${y} L520 ${y + 70}`} />
                <Line f={f} at={-999} c={C.orange} w={8} d={`M580 ${y + 70} L600 ${y} L940 ${y}`} />
              </g>
            ) : (
              <Line key={`${k}${n}`} f={f} at={k === 0 && n > 0 ? last + 12 : m.cords - 10 + k * 4} c={C.orange} w={8} d={`M160 ${y} L940 ${y}`} />
            ),
          )}
          <Label f={f} at={m.three + 18} text={"韋編三絕 THE CORDS\nBROKE THREE TIMES"} x1={540} y1={1085} x2={540} y2={1120} anchor="middle" />
        </Pic>
      </Camera>
    </>
  );
};

// Line 4: the Analects: more study, fewer serious mistakes.
const Sayings: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b4} text="ANALECTS" zh="論語" sub={f >= m.sayings ? "COLLECTED SAYINGS · 7.17" : undefined} />
    <Still>
      <Pic>
        <text x={540} y={720} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={96} letterSpacing={5} fill={C.yellow} style={{ filter: glow(C.yellow, 10) }} opacity={t01(f, m.study - 6, 4)}>MORE STUDY</text>
        <Line f={f} at={m.study + 10} c={C.white} w={7} d="M540 780 L540 880 M500 840 L540 880 L580 840" dur={8} />
        <text x={540} y={1000} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={80} letterSpacing={4} fill={C.green} style={{ filter: glow(C.green, 8) }} opacity={t01(f, m.mistakes - 20, 4)}>
          <tspan x={540}>FEWER SERIOUS</tspan>
          <tspan x={540} dy={96}>MISTAKES</tspan>
        </text>
      </Pic>
    </Still>
  </>
);

// Line 5: ten numbered tabs out of the book's edge; the attribution disputed.
const Wings: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b5} text="TEN WINGS" zh="十翼" />
    <Still>
      <Pic>
        <BookShape f={f} at={-999} x={300} y={460} w={380} h={640} />
        {Array.from({ length: 10 }, (_, k) => {
          const at = m.b5 + 8 + k * 4;
          if (f < at) return null;
          const c = [C.yellow, C.pink, C.green, C.blue, C.violet, C.orange, C.red, C.mint][k % 8];
          const y = 480 + k * 61;
          return (
            <g key={k} style={{ filter: glow(c, 5) }} opacity={t01(f, at, 3)}>
              <rect x={680} y={y} width={90} height={48} fill={`${c}55`} stroke={c} strokeWidth={4} />
              <text x={725} y={y + 36} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={30} fill={c}>{k + 1}</text>
            </g>
          );
        })}
        <Label f={f} at={m.later - 16} text={"AUTHOR:\nDISPUTED"} x1={770} y1={1000} x2={860} y2={1120} anchor="middle" />
      </Pic>
    </Still>
  </>
);

// Line 6: a small figure pauses where a road forks.
const Fork: Page = ({ f, m }) => {
  const s = m.b6;
  return (
    <>
      <Title f={f} at={s} text="SIX LINES" />
      <Still>
        <Pic>
          {/* One road up to the fork, then two. */}
          <Line f={f} at={s} c={C.yellow} d="M400 1220 L500 760 L360 430 M760 1220 L660 760 L800 430" />
          <Line f={f} at={s + 6} c={C.yellow} d="M500 430 L580 700 L660 430" dur={10} />
          <Line f={f} at={s + 6} c={C.yellow} w={6} d="M580 1180 L580 1120 M580 1060 L580 1000 M580 940 L580 880 M560 700 L520 600 M500 550 L485 500 M600 700 L640 600 M660 550 L675 500" dur={8} />
          <Line f={f} at={s + 10} c={C.pink} d={ngon(580, 900, 34, 6, Math.PI / 6)} />
          <Line f={f} at={s + 14} c={C.pink} d={poly([[554, 946], [606, 946], [626, 1080], [534, 1080]])} fill={`${C.pink}33`} fillAt={s + 28} />
          <Label f={f} at={m.judgment} text={"WHAT TO\nDO HERE"} x1={590} y1={720} x2={860} y2={820} anchor="middle" />
        </Pic>
      </Still>
    </>
  );
};

// Line 7: the summary; a spare pair of cords beside the book.
const Summary: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b7} text="SUMMARY" />
    <Still>
      <Pic>
        <BookShape f={f} at={m.b7 + 30} x={300} y={1080} w={160} h={210} />
        {[0, 1].map((k) => (
          <Line key={k} f={f} at={m.b7 + 40 + k * 4} c={C.orange} w={7} d={`M560 ${1150 + k * 60} ${Array.from({ length: 6 }, (_, i) => `L${600 + i * 50} ${1150 + k * 60 + (i % 2 ? -22 : 22)}`).join(" ")}`} />
        ))}
        <Small f={f} at={m.b7 + 50} x={720} y={1300} text="SPARE CORDS" anchor="middle" />
      </Pic>
    </Still>
  </>
);

const PAGES: [string, Page][] = [["b1", Book], ["b2", Confucius], ["b3", Strips], ["b4", Sayings], ["b5", Wings], ["b6", Fork], ["b7", Summary]];

export const GuideCords: React.FC<GuideProps> = (props) => (
  <GuideShort
    {...props}
    pages={PAGES}
    summary={7}
    cues={(m) => {
      const breaks = [m.wore + 4, Math.round((m.wore + m.three) / 2), m.three + 4];
      return (
        <>
          {[m.book, m.historian, m.three + 18, m.sayings, m.later - 16, m.judgment].map((t) => cue("blip-hi", t, 0.18))}
          {breaks.map((t) => cue("blip-down", t, 0.22))}
          {breaks.map((t) => cue("blip-wood", t + 12, 0.24))}
          {cue("chime-ding", m.study, 0.2)}
          {Array.from({ length: 10 }, (_, k) => cue("tick-key", m.b5 + 8 + k * 4, 0.16))}
          {cue("blip-up", m.not - 8, 0.2)}
          {cue("error-buzz", m.e7 + 6, 0.16)}
        </>
      );
    }}
  />
);
