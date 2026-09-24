// Part starts in beats for a series short, counted from the drop (spec: "Structure of a
// short"). `drop` is seconds from the start of the music section; it lands on the nearest beat.
export type SeriesPlan = {
  mode: "before" | "short-hexagram" | "after";
  hexagram: number;
  hexagramBeats: number;
  meaning: number;
  meaningLength: number;
  question: number;
  questionLength: number;
  drop: number;
  showcase: number;
  cta: number;
  // Her credit ("Original edit by ~DISNEYFAN"), after the end card has held.
  credit: number;
  end: number;
};

// The end card's 9 beats let it hold about 2 s once its last line is lit; the credit takes 3.
const CTA_BEATS = 9;
const CREDIT_BEATS = 3;
const ending = (cta: number) => ({ cta, credit: cta + CTA_BEATS, end: cta + CTA_BEATS + CREDIT_BEATS });

// The two meaning lines together need at least this long.
const MEANING_SECONDS = 4;

// Above this tempo 4 beats is under 2 s, so the hook, the question and each meaning line
// hold 8.
const FAST_BPM = 120;

export const seriesPlan = (bpm: number, drop: number): SeriesPlan => {
  const d = Math.round((drop * bpm) / 60);
  const seconds = (beats: number) => (beats * 60) / bpm;
  const q = bpm > FAST_BPM ? 8 : 4;
  const hook = q;
  for (const [mode, h] of [["before", 8], ["short-hexagram", 6]] as const) {
    const meaning = hook + h;
    if (seconds(d - q - meaning) >= MEANING_SECONDS) {
      return {
        mode,
        hexagram: hook,
        hexagramBeats: h,
        meaning,
        meaningLength: d - q - meaning,
        question: d - q,
        questionLength: q,
        drop: d,
        showcase: d,
        ...ending(d + 20),
      };
    }
  }
  // The hexagram holds until the drop, where the meaning starts.
  return {
    mode: "after",
    hexagram: hook,
    hexagramBeats: Math.max(8, d - hook),
    meaning: d,
    meaningLength: 2 * q,
    question: d + 2 * q,
    questionLength: q,
    drop: d,
    showcase: d + 3 * q,
    ...ending(d + 3 * q + 20),
  };
};
