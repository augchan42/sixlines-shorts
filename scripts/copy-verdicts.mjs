// Applies the user's copy verdicts from the review board (series/review/copy-verdicts.json, a
// snapshot of the board's `copy-NN` reviews) to series/copy.json. The versions are the copy
// convergence's (series/critic/convergence/state.json, scripts/convergence.mjs):
//   good          the change Opus and Astra agreed on
//   opus, astra   that reviewer's last choice, on a short they split on
//   take          fields from the other reviewer's choice, as a comment asked (26: Astra's, but
//                 Opus's finding)
// For a short's text these verdicts win over its `short-NN` mark (the user, 2026-09-30: "i think
// further up the review artifact those take precedence with copy").
//
//   node scripts/copy-verdicts.mjs            # writes series/copy.json, prints each change
//   node scripts/copy-verdicts.mjs --dry      # prints only
// Then npm run series:table, and re-render the changed shorts.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const FIELDS = ["hook", "meaning1", "meaning2", "question", "lesson", "finding", "caption"];

const optionOf = (s, who) => (who === "good" ? s.agreed : s.votes[s.votes.length - 1][who].choice);

// The fields each verdict changes, by short number: { 26: { finding: "...", lesson: "..." } }.
export const chosenCopy = (state, verdicts) =>
  Object.fromEntries(
    Object.entries(verdicts).map(([n, v]) => {
      const s = state.shorts[n];
      const id = optionOf(s, v.verdict);
      if (!id || !s.options[id]) throw new Error(`short ${n}: no version for verdict "${v.verdict}"`);
      const pick = { ...s.options[id] };
      for (const [f, who] of Object.entries(v.take ?? {})) pick[f] = s.options[optionOf(s, who)][f];
      const cur = s.options.current;
      return [n, Object.fromEntries(FIELDS.filter((f) => pick[f] !== cur[f]).map((f) => [f, pick[f]]))];
    }),
  );

// series/copy.json with the changes written in, each changed field's source set to `source`.
export const applyCopy = (copy, changes, source) => {
  const out = structuredClone(copy);
  for (const [n, c] of Object.entries(changes)) {
    const x = out[n];
    const set = (obj, text) => Object.assign(obj, { text, source });
    for (const [f, text] of Object.entries(c)) {
      if (f === "hook" || f === "question" || f === "caption") set(x[f], text);
      else if (f === "meaning1") set(x.meaning[0], text);
      else if (f === "meaning2") set(x.meaning[1], text);
      else if (f === "lesson") set(x.lesson, text);
      else if (f === "finding") x.lesson.readout.finding = text;
    }
  }
  return out;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = path.resolve(import.meta.dirname, "..");
  const json = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"));
  const state = json("series/critic/convergence/state.json");
  const { verdicts } = json("series/review/copy-verdicts.json");
  const changes = chosenCopy(state, verdicts);
  const copy = json("series/copy.json");
  // The copy must still be what the reviewers saw, or a verdict would undo a later change.
  for (const n of Object.keys(changes)) {
    const x = copy[n];
    const now = { hook: x.hook.text, meaning1: x.meaning[0].text, meaning2: x.meaning[1].text, question: x.question.text, lesson: x.lesson?.text ?? null, finding: x.lesson?.readout?.finding ?? null, caption: x.caption.text };
    const moved = FIELDS.filter((f) => now[f] !== state.shorts[n].options.current[f]);
    if (moved.length) throw new Error(`short ${n}: ${moved.join(", ")} changed since the convergence`);
  }
  for (const [n, c] of Object.entries(changes)) for (const [f, t] of Object.entries(c)) console.log(`${n} ${f}: ${JSON.stringify(t)}`);
  const changed = Object.entries(changes).filter(([, c]) => Object.keys(c).length).map(([n]) => Number(n));
  console.log(`${changed.length} shorts change: ${changed.join(" ")}`);
  if (!process.argv.includes("--dry")) {
    const src = (n) => `series/critic/convergence/state.json#${n} (the user's verdict, series/review/copy-verdicts.json)`;
    let out = copy;
    for (const n of changed) out = applyCopy(out, { [n]: changes[n] }, src(n));
    writeFileSync(path.join(root, "series/copy.json"), `${JSON.stringify(out, null, 1)}\n`);
  }
}
