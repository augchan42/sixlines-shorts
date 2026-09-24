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

export const seriesPlan = (bpm: number, drop: number): SeriesPlan => {
  const d = Math.round((drop * bpm) / 60);
  const seconds = (beats: number) => (beats * 60) / bpm;
  for (const [mode, h] of [["before", 8], ["short-hexagram", 6]] as const) {
    const meaning = 4 + h;
    if (seconds(d - 4 - meaning) >= MEANING_SECONDS) {
      return {
        mode,
        hexagram: 4,
        hexagramBeats: h,
        meaning,
        meaningLength: d - 4 - meaning,
        question: d - 4,
        questionLength: 4,
        drop: d,
        showcase: d,
        ...ending(d + 16),
      };
    }
  }
  return {
    mode: "after",
    hexagram: 4,
    hexagramBeats: 8,
    meaning: d,
    meaningLength: 8,
    question: d + 8,
    questionLength: 4,
    drop: d,
    showcase: d + 12,
    ...ending(d + 28),
  };
};
