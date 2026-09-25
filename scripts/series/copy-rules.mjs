// The series copy rules (spec: "Copy"). Returns every problem in one entry.

// At 110 px in the code-rain font, about 18 characters fill the 940 px text column.
const MAX_LINE = 18;

const TONE = [
  [/\bAI\b/, "says AI"],
  [/\bshould\b/i, 'says "should"'],
  [/!/, "has an exclamation mark"],
  [/\b(fortunes?|predict\w*|magic\w*|supernatural|horoscopes?)\b/i, "uses fortune-telling words"],
  [/I Ching/, 'writes "I Ching" without the hyphen'],
];

const words = (text) => text.split(/\s+/).filter(Boolean).length;

export const copyProblems = (n, e) => {
  const problems = [];
  if (e.plates?.length !== 2) problems.push("plates: need two");
  for (const key of e.plates ?? []) {
    const [h, k] = key.split("-").map(Number);
    if (h !== n || !(k >= 1 && k <= 64)) problems.push(`plates: ${key} is not a plate of ${n}`);
    else if (k === n) problems.push(`plates: ${key} is the verse screen's plate`);
  }
  const parts = [
    ["hook", e.hook, 3, 7, false],
    ["meaning 1", e.meaning?.[0], 3, 6, true],
    ["meaning 2", e.meaning?.[1], 3, 6, true],
    ["question", e.question, 1, 6, true],
    // The post caption: the short's thought in a few sentences, with the image the video
    // leaves out.
    ["caption", e.caption, 8, 35, false],
    // The sentence after a lesson's picture, typed over code rain like the meaning.
    ...(e.lesson ? [["lesson", e.lesson, 3, 7, true]] : []),
  ];
  for (const part of parts) problems.push(...partProblems(...part));
  return problems;
};

// One part's problems: missing, unsourced, word count, width on the rain, tone.
export const partProblems = (name, part, min, max, onRain) => {
  if (!part?.text) return [`${name}: missing`];
  const problems = [];
  if (!part.source) problems.push(`${name}: no source`);
  const n = words(part.text);
  if (n < min || n > max) problems.push(`${name}: ${n} words (${min}–${max})`);
  if (onRain) {
    const lines = part.text.split("\n");
    if (lines.length > 2) problems.push(`${name}: ${lines.length} screen lines (2 at most)`);
    for (const l of lines) if (l.length > MAX_LINE) problems.push(`${name}: "${l}" is too wide (over ${MAX_LINE} characters)`);
  }
  for (const [re, why] of TONE) if (re.test(part.text)) problems.push(`${name}: ${why}`);
  return problems;
};
