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

// Beats from the drop to the end card: the showcase's app screens, or a lesson (spec
// 2026-09-25) that teaches one thing about the hexagram in two halves.
export const SHOWCASE_BEATS = 20;
export const LESSON_BEATS = 12;
// A held lesson gets longer, so the picture on the drop can land before the sentence.
export const HELD_LESSON_BEATS = 16;

// How the text before the drop is cut: "even" gives each meaning line its own card and the
// question 4 beats; "held" shows both lines on one card and runs the question half as long
// again into the drop, so the parts are not all the same length.
export type Pace = "even" | "held";
// The meaning shown as one card needs at least this long.
const CARD_SECONDS = 3;

// The two meaning lines together need at least this long.
const MEANING_SECONDS = 4;

// Above this tempo 4 beats is under 2 s, so the hook, the question and each meaning line
// hold 8.
const FAST_BPM = 120;

export const seriesPlan = (bpm: number, drop: number, after = SHOWCASE_BEATS, pace: Pace = "even"): SeriesPlan => {
  const d = Math.round((drop * bpm) / 60);
  const seconds = (beats: number) => (beats * 60) / bpm;
  const q = bpm > FAST_BPM ? 8 : 4;
  const hook = q;
  const held = pace === "held";
  const ql = held ? q + q / 2 : q;
  for (const [mode, h] of [["before", 8], ["short-hexagram", 6]] as const) {
    const meaning = hook + h;
    if (seconds(d - ql - meaning) >= (held ? CARD_SECONDS : MEANING_SECONDS)) {
      return {
        mode,
        hexagram: hook,
        hexagramBeats: h,
        meaning,
        meaningLength: d - ql - meaning,
        question: d - ql,
        questionLength: ql,
        drop: d,
        showcase: d,
        ...ending(d + after),
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
    ...ending(d + 3 * q + after),
  };
};

// The plan for a short's props: a lesson, when it has one, replaces the showcase.
export const planOf = (p: { bpm: number; drop: number; lesson?: unknown; pace?: Pace }) =>
  seriesPlan(p.bpm, p.drop, p.lesson ? (p.pace === "held" ? HELD_LESSON_BEATS : LESSON_BEATS) : SHOWCASE_BEATS, p.pace);
