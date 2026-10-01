import { fonts } from "../lib/fonts";
import { C, cue, eased, glow, GuideShort, Line, moved, Pic, poly, sans, Still, t01, Title, type GuideProps, type P, type Page } from "./guide-kit";

// The Guide entry on the eight trigrams (queued overnight, the user, 2026-10-01: "please queue up
// a few more shorts/and ideas"). Narration and picture notes: series/specials/guide-trigrams.json
// (draft 2, Astra's revision, round 1 converged). Every page holds still.

type Tri = { lines: number[]; zh: string; en: string; quality: string; animal: string; mark: string };
// In the Discussion of the Trigrams' order; lines bottom first.
const EIGHT: Tri[] = [
  { lines: [1, 1, 1], zh: "乾", en: "HEAVEN", quality: "STRONG", animal: "HORSE", mark: "heaven" },
  { lines: [0, 0, 0], zh: "坤", en: "EARTH", quality: "YIELDING", animal: "OX", mark: "earth" },
  { lines: [1, 0, 0], zh: "震", en: "THUNDER", quality: "MOVING", animal: "DRAGON", mark: "thunder" },
  { lines: [0, 1, 1], zh: "巽", en: "WIND", quality: "ENTERING", animal: "CHICKEN", mark: "wind" },
  { lines: [0, 1, 0], zh: "坎", en: "WATER", quality: "DANGER", animal: "PIG", mark: "water" },
  { lines: [1, 0, 1], zh: "離", en: "FIRE", quality: "CLINGING", animal: "PHEASANT", mark: "fire" },
  { lines: [0, 0, 1], zh: "艮", en: "MOUNTAIN", quality: "STOPPING", animal: "DOG", mark: "mountain" },
  { lines: [1, 1, 0], zh: "兌", en: "LAKE", quality: "JOY", animal: "SHEEP", mark: "lake" },
];
const TEXT = { fontFamily: sans, fontWeight: 800, letterSpacing: 3 } as const;

// Three lines, bottom first, filled bars.
const Trigram: React.FC<{ lines: number[]; x: number; y: number; w: number; c: string; opacity?: number }> = ({ lines, x, y, w, c, opacity = 1 }) => {
  const bar = w * 0.11, gap = w * 0.07;
  return (
    <g style={{ filter: glow(c, 5) }} opacity={opacity}>
      {lines.map((l, i) => {
        const yy = y + (2 - i) * (bar + gap);
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
const triH = (w: number) => w * (0.33 + 0.14);

// The animals as outlines in a box about 120 wide and 100 high, facing right: a closed body and
// strokes for legs, horns and tails.
const ANIMAL: Record<string, { body: P[]; strokes?: string }> = {
  HORSE: { body: [[10, 40], [70, 40], [86, 8], [106, 14], [100, 30], [86, 36], [84, 62], [22, 62], [8, 50]], strokes: "M24 62 L20 98 M40 62 L40 98 M70 62 L70 98 M82 62 L86 98 M10 44 L-8 70" },
  OX: { body: [[10, 36], [80, 36], [92, 32], [108, 40], [104, 58], [88, 58], [84, 68], [16, 68], [6, 50]], strokes: "M92 32 L86 12 M104 38 L118 22 M24 68 L24 98 M40 68 L40 98 M66 68 L66 98 M80 68 L80 98" },
  DRAGON: { body: [[96, 20], [122, 30], [100, 42]], strokes: "M-6 70 L14 36 L34 76 L54 36 L74 76 L96 32 M14 36 L8 20 M54 36 L48 20 M96 32 L90 14" },
  CHICKEN: { body: [[24, 44], [66, 36], [78, 14], [94, 18], [96, 34], [88, 44], [84, 66], [56, 78], [30, 70], [18, 50], [8, 20]], strokes: "M80 14 L84 4 L90 12 M96 26 L108 30 L96 32 M50 78 L46 100 M64 76 L68 100" },
  PIG: { body: [[14, 40], [82, 36], [102, 46], [116, 48], [116, 62], [102, 64], [86, 74], [16, 76], [4, 58]], strokes: "M24 76 L24 98 M40 76 L40 98 M66 76 L66 98 M80 74 L80 98 M6 52 L-6 46 L0 38" },
  PHEASANT: { body: [[40, 50], [70, 40], [84, 18], [100, 22], [96, 36], [88, 44], [84, 62], [56, 74], [36, 70]], strokes: "M38 60 L-50 96 M40 66 L-40 104 M60 74 L58 100 M72 70 L76 100" },
  DOG: { body: [[12, 42], [72, 42], [80, 16], [92, 10], [108, 24], [96, 36], [88, 40], [86, 64], [16, 64]], strokes: "M22 64 L20 98 M36 64 L36 98 M70 64 L70 98 M84 64 L86 98 M12 46 L-4 26" },
  SHEEP: { body: [[10, 44], [24, 30], [42, 36], [58, 26], [76, 36], [92, 32], [112, 44], [104, 60], [90, 66], [70, 72], [46, 72], [24, 70], [8, 60]], strokes: "M92 32 L106 20 L116 34 M28 70 L28 98 M44 72 L44 98 M70 72 L70 98 M84 68 L84 98" },
};
const Animal: React.FC<{ name: string; f: number; at: number; x: number; y: number; s?: number; c?: string }> = ({ name, f, at, x, y, s = 1, c = C.orange }) => {
  const a = ANIMAL[name];
  const strokes = a.strokes?.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, px, py) => `${x + Number(px) * s} ${y + Number(py) * s}`);
  return (
    <>
      <Line f={f} at={at} c={c} w={6} d={poly(moved(a.body, x, y, s))} fill={`${c}33`} fillAt={at + 12} dur={10} />
      {strokes && <Line f={f} at={at + 3} c={c} w={6} d={strokes} dur={8} />}
    </>
  );
};

// The eight in a grid of four columns and two rows.
const cell = (k: number) => ({ cx: 165 + (k % 4) * 250, y: 380 + Math.floor(k / 4) * 440 });

// Line 1: the title; a six-line figure (63) splits into its two halves.
const Split: Page = ({ f, m }) => {
  const k = eased(f, m.halves - 12, m.halves + 8);
  const w = 300, x = 390, y = 520;
  return (
    <>
      <Title f={f} at={m.b1} text="THE I-CHING" />
      <Still>
        <Pic>
          {f >= m.b1 + 20 && (
            <>
              <Trigram lines={[0, 1, 0]} x={x} y={y - k * 80} w={w} c={C.yellow} opacity={t01(f, m.b1 + 20, 6)} />
              <Trigram lines={[1, 0, 1]} x={x} y={y + triH(w) + w * 0.07 + k * 80} w={w} c={C.yellow} opacity={t01(f, m.b1 + 20, 6)} />
            </>
          )}
          {[y - 80 + triH(w) / 2, y + triH(w) + w * 0.07 + 80 + triH(w) / 2].map((ty, i) => (
            <text key={i} x={x + w + 40} y={ty + 14} {...TEXT} fontSize={40} fill={C.green} style={{ filter: glow(C.green, 5) }} opacity={t01(f, m.trigrams + i * 4, 4)}>TRIGRAM</text>
          ))}
        </Pic>
      </Still>
    </>
  );
};

// Line 2: the two kinds of line; the eight tile in; 2 × 2 × 2 = 8.
const Eight: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b2} text="EIGHT" />
    <Still>
      <Pic>
        <g opacity={t01(f, m.b2 + 4, 4)}>
          <Trigram lines={[1]} x={200} y={262} w={200} c={C.white} />
          <text x={300} y={410} textAnchor="middle" {...TEXT} fontSize={36} fill={C.green}>SOLID</text>
          <Trigram lines={[0]} x={580} y={262} w={200} c={C.white} />
          <text x={680} y={410} textAnchor="middle" {...TEXT} fontSize={36} fill={C.green}>BROKEN</text>
        </g>
        {EIGHT.map((t, k) => {
          const { cx } = cell(k);
          const y = 500 + Math.floor(k / 4) * 260;
          return f < m.eight + k * 3 ? null : <Trigram key={k} lines={t.lines} x={cx - 70} y={y} w={140} c={C.yellow} opacity={t01(f, m.eight + k * 3, 4)} />;
        })}
        <text x={540} y={1120} textAnchor="middle" {...TEXT} fontSize={72} fill={C.yellow} style={{ filter: glow(C.yellow, 8) }} opacity={t01(f, m.solid + 30, 4)}>2 × 2 × 2 = 8</text>
      </Pic>
    </Still>
  </>
);

// Lines 3 and 4: four cards each, the trigram, its name and its quality from the Discussion.
const Cards: React.FC<{ f: number; m: Record<string, number>; from: number }> = ({ f, m, from }) => (
  <Still>
    <Pic>
      {EIGHT.slice(from, from + 4).map((t, i) => {
        const at = m[t.mark] - 6;
        if (f < at) return null;
        const cx = i % 2 ? 790 : 290, cy = 560 + Math.floor(i / 2) * 400;
        return (
          <g key={t.en} opacity={t01(f, at, 4)}>
            <rect x={cx - 210} y={cy - 170} width={420} height={340} fill="none" stroke={C.blue} strokeWidth={4} style={{ filter: glow(C.blue, 5) }} />
            <Trigram lines={t.lines} x={cx - 80} y={cy - 130} w={160} c={C.yellow} />
            <text x={cx} y={cy + 50} textAnchor="middle" {...TEXT} fontSize={44} fill={C.green} style={{ filter: glow(C.green, 5) }}>
              <tspan fontFamily={fonts.serif} fontWeight={500}>{t.zh}</tspan> {t.en}
            </text>
            <text x={cx} y={cy + 125} textAnchor="middle" {...TEXT} fontSize={52} fill={C.yellow} style={{ filter: glow(C.yellow, 6) }}>{t.quality}</text>
          </g>
        );
      })}
    </Pic>
  </Still>
);
const Qualities: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b3} text="QUALITIES" sub={f >= m.commentary ? "說卦 DISCUSSION OF THE TRIGRAMS" : undefined} />
    <Cards f={f} m={m} from={0} />
  </>
);
const Qualities2: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b4 - 999} text="QUALITIES" sub="說卦 DISCUSSION OF THE TRIGRAMS" />
    <Cards f={f} m={m} from={4} />
  </>
);

// Line 5: the grid again, each trigram's animal drawn under it as it is named.
const MARK: Record<string, string> = { HORSE: "horse", OX: "ox", DRAGON: "dragon", CHICKEN: "chicken", PIG: "pig", PHEASANT: "pheasant", DOG: "dog", SHEEP: "sheep" };
const Animals: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b5} text="ANIMALS" />
    <Still>
      <Pic>
        {EIGHT.map((t, k) => {
          const { cx, y } = cell(k);
          const at = m[MARK[t.animal]] - 4;
          return (
            <g key={k}>
              <Trigram lines={t.lines} x={cx - 60} y={y} w={120} c={C.yellow} />
              <text x={cx} y={y + 110} textAnchor="middle" {...TEXT} fontSize={30} fill={C.green}>
                <tspan fontFamily={fonts.serif} fontWeight={500}>{t.zh}</tspan> {t.en}
              </text>
              <Animal name={t.animal} f={f} at={at} x={cx - 60} y={y + 150} />
              <text x={cx} y={y + 300} textAnchor="middle" {...TEXT} fontSize={30} fill={C.orange} style={{ filter: glow(C.orange, 4) }} opacity={t01(f, at + 6, 4)}>{t.animal}</text>
            </g>
          );
        })}
      </Pic>
    </Still>
  </>
);

// Line 6: fire slides up under water: 63, After Completion; the Image's warning.
const Stack: Page = ({ f, m }) => {
  const w = 300, x = 390, y = 440;
  const fy = y + triH(w) + w * 0.07;
  const k = eased(f, m.stack, m.stack + 24);
  return (
    <>
      <Title f={f} at={m.b6} text="STACKED" />
      <Still>
        <Pic>
          <Trigram lines={[0, 1, 0]} x={x} y={y} w={w} c={C.blue} opacity={t01(f, m.b6 + 4, 4)} />
          <text x={x - 40} y={y + 80} textAnchor="end" {...TEXT} fontSize={34} fill={C.green} opacity={t01(f, m.b6 + 4, 4)}>
            <tspan fontFamily={fonts.serif} fontWeight={500}>坎</tspan> WATER
          </text>
          <Trigram lines={[1, 0, 1]} x={x} y={fy + (1 - k) * 360} w={w} c={C.orange} opacity={t01(f, m.stack - 4, 4)} />
          <text x={x - 40} y={fy + (1 - k) * 360 + 80} textAnchor="end" {...TEXT} fontSize={34} fill={C.green} opacity={t01(f, m.stack - 4, 4)}>
            <tspan fontFamily={fonts.serif} fontWeight={500}>離</tspan> FIRE
          </text>
          <text x={540} y={1000} textAnchor="middle" {...TEXT} fontSize={52} fill={C.yellow} style={{ filter: glow(C.yellow, 6) }} opacity={t01(f, m.across - 6, 4)}>
            63 <tspan fontFamily={fonts.serif} fontWeight={500}>既濟</tspan> AFTER COMPLETION
          </text>
          <text x={540} y={1120} textAnchor="middle" {...TEXT} fontSize={44} fill={C.green} style={{ filter: glow(C.green, 5) }} opacity={t01(f, m.guard, 4)}>GUARD AGAINST TROUBLE</text>
        </Pic>
      </Still>
    </>
  );
};

// Line 7: the summary; the same chicken, still, under the second row.
const Summary: Page = ({ f, m }) => (
  <>
    <Title f={f} at={m.b7} text="SUMMARY" />
    <Still>
      <Pic>
        <Animal name="CHICKEN" f={f} at={m.not + 20} x={440} y={1050} s={1.6} />
      </Pic>
    </Still>
  </>
);

const PAGES: [string, Page][] = [["b1", Split], ["b2", Eight], ["b3", Qualities], ["b4", Qualities2], ["b5", Animals], ["b6", Stack], ["b7", Summary]];

export const GuideTrigrams: React.FC<GuideProps> = (props) => (
  <GuideShort
    {...props}
    pages={PAGES}
    summary={7}
    cues={(m) => (
      <>
        {cue("slide", m.halves - 12, 0.2)}
        {[m.trigrams, m.trigrams + 4].map((t) => cue("blip-hi", t, 0.18))}
        {EIGHT.map((_, k) => cue("tick-key", m.eight + k * 3, 0.18))}
        {cue("chime-ding", m.solid + 30, 0.2)}
        {EIGHT.map((t) => cue("blip-pluck", m[t.mark] - 6, 0.2))}
        {Object.values(MARK).map((k) => cue("blip-wood", m[k] - 4, 0.2))}
        {cue("slide", m.stack, 0.2)}
        {cue("blip-hi", m.across - 6, 0.18)}
        {cue("blip-down", m.guard, 0.18)}
        {cue("blip-up", m.not - 8, 0.2)}
        {cue("error-buzz", m.e7 + 6, 0.16)}
      </>
    )}
  />
);
