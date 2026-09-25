// Checks a lessons file against the lesson rules (scripts/series/lesson-rules.mjs).
//   node scripts/lesson-check.mjs [series/lessons.json]
import { readFileSync } from "node:fs";
import { lessonProblems } from "./series/lesson-rules.mjs";

const file = process.argv[2] ?? "series/lessons.json";
const read = (f) => JSON.parse(readFileSync(f, "utf8"));
const data = read(file);
const problems = lessonProblems(Array.isArray(data) ? data : data.lessons, read("series/critic/lessons/input.json"), read("series/characters.json").characters);
console.log(problems.length ? problems.join("\n") : "no problems");
process.exit(problems.length ? 1 : 0);
