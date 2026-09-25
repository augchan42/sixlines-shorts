// The rules a lesson (series/lessons.json) keeps, besides the critic's judgment: the copy
// rules for its sentence, a known kind, the line a line lesson lights, a painting only where
// one is on offer (series/critic/lessons/input.json), a character only where it is drawn
// (series/characters.json, blender/character.py). Neighbours may share a kind: the author
// posts in any order.
import { partProblems } from "./copy-rules.mjs";

export const KINDS = ["lines", "judgment", "line", "painting", "character"];
const flat = (t) => t.replace(/\s+/g, " ").replace(/[^\p{L}\p{N} ]/gu, "").trim().toLowerCase();

export const lessonProblems = (lessons, input, characters = []) => {
  const byNumber = Object.fromEntries(input.hexagrams.map((h) => [h.number, h]));
  const problems = [];
  const sorted = [...lessons].sort((a, b) => a.number - b.number);
  for (const l of sorted) {
    const h = byNumber[l.number];
    const say = (p) => problems.push(`${l.number}: ${p}`);
    for (const p of partProblems("lesson", l, 3, 7, true)) say(p);
    if (!KINDS.includes(l.kind)) say(`kind "${l.kind}" is not one of ${KINDS.join(", ")}`);
    if (l.kind === "line" && !(l.line >= 1 && l.line <= 6)) say("a line lesson needs its line, 1 to 6");
    if (l.kind === "painting" && !h?.painting) say("no painting is on offer for this hexagram");
    if (l.kind === "character" && !characters.some((c) => c.number === l.number)) say("no character drawing in series/characters.json");
    if (h && l.text && [h.copy.hook, ...h.copy.meaning, h.copy.question].some((c) => flat(c) === flat(l.text))) say("repeats the short's own copy");
  }
  return problems;
};
