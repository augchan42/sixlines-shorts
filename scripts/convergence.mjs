// Opus 5.5 and Astra review the 64 shorts' on-screen copy until they agree. The user,
// 2026-09-29: "set it up for agreement with high effort on the models initially". Agreement,
// not a score, is the gate: each short ends when both reviewers choose the same wording
// (the shipped copy or a rewrite). Scores are kept as notes. Rounds 1 and 2 run at high
// effort, round 3 at xhigh on what is still split; after round 3 the user decides.
//
//   node scripts/convergence.mjs brief          # series/critic/convergence/brief.md, sources.json, state.json
//   node scripts/convergence.mjs round N        # runs round N on every short not yet agreed
//   node scripts/convergence.mjs report         # docs/research/2026-09-29-copy-convergence.md
//
// Each reviewer runs with no memory of this project (Opus with auto-memory off, Astra
// read-only), so both start from the same context file (series/critic/convergence/context.md).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { planOf } from "../src/lib/seriesPlan.ts";
import { sentenceBeat } from "../src/lib/seriesMotion.ts";
import { STAGED, TIMED } from "../src/lib/readoutAmber.ts";
import { partProblems } from "./series/copy-rules.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "series/critic/convergence");
const FIELDS = ["hook", "meaning1", "meaning2", "question", "lesson", "finding", "caption"];
export const REVIEWERS = ["opus", "astra"];
export const LAST_ROUND = 3;
export const effortOf = (round) => (round >= 3 ? "xhigh" : "high");
const BANNED = [/oracle/i, /divinat/i, /fortune/i, /predict/i, /mystic/i, /magic/i, /預測|预测|占卜|算命|神諭/];

const pad = (n) => String(n).padStart(2, "0");
const record = (n) => JSON.parse(readFileSync(path.join(root, `series/renders/${pad(n)}.json`), "utf8"));
const post = (n) => readFileSync(path.join(root, `series/renders/${pad(n)}.txt`), "utf8").split(/\n\s*\n/);

// The text a reviewer may change, as shipped.
export const copyOf = (props, postParts) => ({
  hook: props.hook,
  meaning1: props.meaning[0],
  meaning2: props.meaning[1],
  question: props.question,
  lesson: props.lesson?.text ?? null,
  finding: props.lesson?.readout?.finding ?? null,
  caption: postParts[1].trim(),
});

// Rule problems in one short's copy (spec "Copy", scripts/series/copy-rules.mjs), without
// the source check, which is for drafts.
export const problemsOf = (c, readout) => {
  const part = (name, text, min, max, onRain, maxLine) =>
    text == null ? [] : partProblems(name, { text, source: "-", fits: true }, min, max, onRain, maxLine);
  const out = [
    ...part("hook", c.hook, 3, 7, false),
    ...part("meaning 1", c.meaning1, 3, 6, true),
    ...part("meaning 2", c.meaning2, 3, 6, true),
    ...part("question", c.question, 1, 6, true),
    ...part("lesson", c.lesson, 3, readout ? 9 : 7, true, readout ? 30 : 18),
    ...part("caption", c.caption, 8, 35, false),
  ];
  if (c.finding != null) for (const l of c.finding.split("\n")) if (l.length > 40) out.push(`finding: "${l}" is too wide (over 40 characters)`);
  for (const f of FIELDS) for (const re of BANNED) if (c[f] && re.test(c[f])) out.push(`${f}: uses a banned word (${re.source})`);
  const sentences = c.caption.split(/(?<=[.?!])\s+/).filter(Boolean).length;
  if (sentences > 2) out.push(`caption: ${sentences} sentences (1 to 2)`);
  return out;
};

// What each Blender scene shows, from the docstrings of blender/acts.py and the scene scripts.
const sceneText = () => {
  const acts = readFileSync(path.join(root, "blender/acts.py"), "utf8");
  const out = {};
  for (const m of acts.matchAll(/def act_\w+\(st, end\):\n\s+"""(\d+) ([\s\S]*?)"""/g)) out[Number(m[1])] = `${m[1]} ${m[2]}`.replace(/\s+/g, " ").replace(/\s*\([^)]*[Cc]ritic[^)]*\)/g, "").trim();
  for (const [script, n] of [["bite", 21], ["abyss", 29], ["bird", 62]]) {
    const doc = readFileSync(path.join(root, `blender/${script}.py`), "utf8").match(/"""([\s\S]*?)"""/)[1];
    out[n] = doc.split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
  }
  return out;
};

// One short as a viewer meets it: every piece of text at the second it appears, for as long as
// it stays, then the post. As scripts/copy-brief.mjs, but from the render record, so it is
// what shipped, with the lesson each short has now.
export const timeline = (n, props, c, { characters, scenes }) => {
  const { bpm, firstBeat } = props;
  const p = planOf(props);
  const t = (beat) => firstBeat + (beat * 60) / bpm;
  const at = (a, b) => `${t(a).toFixed(1)}–${t(b).toFixed(1)} s (${(t(b) - t(a)).toFixed(1)} s)`;
  const text = (s) => s.split("\n").map((l) => `    ${l}`).join("\n");
  const h = props.hexagram;
  const lesson = props.lesson;
  const events = [
    [p.hook ?? 0, `${at(0, p.hexagram)}  HOOK, large, typed on over black:\n${text(c.hook)}`],
    [p.hexagram, `${at(p.hexagram, p.meaning)}  A 3D hexagram builds line by line. As the last line lands, its names fade in:\n    ${h.zh}  ${h.pinyin}\n    ${h.name}`],
  ];
  if (props.pace === "held") {
    events.push([p.meaning, `${at(p.meaning, p.meaning + p.meaningLength)}  MEANING 1 and MEANING 2 on one card, over an old woodcut plate and falling code:\n${text(c.meaning1)}\n${text(c.meaning2)}`]);
  } else {
    const half = p.meaningLength / 2;
    events.push([p.meaning, `${at(p.meaning, p.meaning + half)}  MEANING 1, over an old woodcut plate and falling code, typed on:\n${text(c.meaning1)}`]);
    events.push([p.meaning + half, `${at(p.meaning + half, p.meaning + p.meaningLength)}  MEANING 2, over another plate, typed on:\n${text(c.meaning2)}`]);
  }
  events.push([p.question, `${at(p.question, p.question + p.questionLength)}  QUESTION, over falling code, typed on:\n${text(c.question)}`]);
  events.push([p.drop - 0.001, `${t(p.drop).toFixed(1)} s  The music drops.`]);
  const span = at(p.showcase, p.cta);
  if (lesson?.readout) {
    const r = lesson.readout;
    const secs = t(p.cta) - t(p.showcase);
    const staged = r.master?.line !== undefined || (!!r.timed && !r.master);
    const T = r.master ? STAGED : TIMED;
    const share = (s) => s * secs;
    const findingAt = staged ? T.finding : r.master ? share(0.5) : share(0.42);
    const masterAt = staged ? T.master : share(0.42);
    const answerAt = (staged ? T.answer : r.master ? (r.finding ? share(0.58) : share(0.52)) : r.finding ? share(0.5) : share(0.44)) + 1 / 3;
    const s0 = t(p.showcase);
    const lineNames = (ix) => ix.map((i) => (i === 0 ? "the bottom line" : i === 5 ? "the top line" : `line ${i + 1}`)).join(" and ");
    const [upper, lower] = lesson.trigrams;
    const parts = [
      `${span}  LESSON as a green ship's-computer terminal readout. Header "SIX LINES // QUERY ${pad(n)}"; the six lines plot bottom to top with their labels; then "UPPER ${upper.zh} ${upper.name}" and "LOWER ${lower.zh} ${lower.name}" with a word for what each trigram does.`,
    ];
    if (r.master) parts.push(`    at ${(s0 + masterAt).toFixed(1)} s, in amber: "> WANG BI: ${r.master.zh}" / "${r.master.en.toUpperCase()}" (a fixed quotation; not reviewable)`);
    if (r.finding) parts.push(`    at ${(s0 + findingAt).toFixed(1)} s, FINDING, in amber${r.mark?.length ? `, with ${lineNames(r.mark)} lit amber` : ""}:\n${text(`> ${r.finding}`)}`);
    parts.push(`    at ${(s0 + answerAt).toFixed(1)} s until ${t(p.cta).toFixed(1)} s, after "> ${h.name.toUpperCase()}:", LESSON, typed large in capitals:\n${text(lesson.text.toUpperCase())}`);
    events.push([p.showcase, parts.join("\n")]);
  } else if (lesson?.kind === "character") {
    const ch = characters[n];
    const from = sentenceBeat(p, lesson);
    events.push([p.showcase, `${span}  A neon drawing of the character ${ch?.char ?? "?"} builds stroke by stroke: ${ch?.story ?? ""}`]);
    events.push([from, `${at(from, p.cta)}  LESSON, typed on above the character:\n${text(lesson.text)}`]);
  } else if (lesson?.clip) {
    const from = sentenceBeat(p, lesson);
    events.push([p.showcase, `${span}  The hexagram's own lines act a short scene, no words: ${scenes[n] ?? ""}`]);
    events.push([from, `${at(from, p.cta)}  LESSON, typed on under the scene:\n${text(lesson.text)}`]);
  }
  events.push([p.cta, `${t(p.cta).toFixed(1)} s to the end  End card: the app's name, SIX LINES, and its site (the same in every short; not reviewable).`]);
  events.sort((a, b) => a[0] - b[0]);
  return [
    `## Short ${n}: ${h.name}`,
    "",
    `Until ${t(p.drop).toFixed(1)} s a small label sits at the top: "${n} / 64 · SIXTY-FOUR RECORDS".`,
    "",
    ...events.map((e) => e[1]),
    "",
    "CAPTION, the post under the video (after it come the fixed lines \"Reveal the moment. sixlines.day\" and hashtags):",
    "",
    `    ${c.caption}`,
    "",
  ].join("\n");
};

// The state after round 1: for each short, the options (full copy), each reviewer's votes, and
// the option both chose, if any.
export const tally = (state, round, votes) => {
  for (const [n, s] of Object.entries(state.shorts)) {
    if (s.agreed) continue;
    const got = {};
    for (const who of REVIEWERS) {
      const v = votes[who]?.[n];
      if (!v) continue;
      let choice = v.choice;
      if (choice === "new") {
        choice = `${who}-${round}`;
        s.options[choice] = { ...s.options.current, ...v.rewrite };
        s.problems[choice] = problemsOf(s.options[choice], s.readout);
      } else if (!s.options[choice]) choice = "current";
      got[who] = { choice, score: v.score, reason: v.reason };
    }
    s.votes.push({ round, ...got });
    const [a, b] = REVIEWERS.map((w) => got[w]?.choice);
    // Two rewrites that say the same thing are one option.
    const same = a && b && (a === b || JSON.stringify(s.options[a]) === JSON.stringify(s.options[b]));
    if (same) s.agreed = a;
  }
  return state;
};

// Round 1: independent. Each reviewer's answer: {shorts: [{number, verdict, score, reason, rewrite?}]}.
// Later rounds: {shorts: [{number, choice, score, reason, rewrite?}]}; choice is an option id or "new".
export const votesOf = (answer, round) =>
  Object.fromEntries(
    (answer?.shorts ?? []).map((x) => [
      String(x.number),
      round === 1
        ? { choice: x.verdict === "change" && x.rewrite && Object.keys(x.rewrite).length ? "new" : "current", score: x.score, reason: x.reason, rewrite: clean(x.rewrite) }
        : { choice: x.choice, score: x.score, reason: x.reason, rewrite: clean(x.rewrite) },
    ]),
  );

const clean = (rw) => Object.fromEntries(Object.entries(rw ?? {}).filter(([k, v]) => FIELDS.includes(k) && typeof v === "string" && v.trim()));

// The first JSON object in a reviewer's answer.
export const parseAnswer = (text) => {
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a < 0 || b < a) return null;
  try {
    return JSON.parse(text.slice(a, b + 1));
  } catch {
    return null;
  }
};

const showCopy = (c) =>
  FIELDS.filter((f) => c[f] != null)
    .map((f) => `      ${f}: ${JSON.stringify(c[f])}`)
    .join("\n");

const roundPrompt = (round, numbers, state, brief) => {
  const context = readFileSync(path.join(dir, "context.md"), "utf8");
  const sections = Object.fromEntries(brief.split(/\n(?=## Short )/).map((s) => [s.match(/## Short (\d+)/)?.[1], s]));
  if (round === 1) {
    return [
      context,
      "# Round 1",
      "",
      `Review shorts ${numbers.join(", ")}. Read each one's timeline below. The classic text for every hexagram is in series/critic/convergence/sources.json (key = hexagram number); read the entries for these shorts before judging faithfulness.`,
      "",
      ...numbers.map((n) => sections[n]),
      "",
      "Answer with JSON only, no other text:",
      '{"shorts": [{"number": 7, "verdict": "ship" | "change", "score": 1-10, "reason": "one or two sentences", "rewrite": {"field": "new text", ...}}]}',
      'Give "rewrite" only with "change", with only the fields you change (hook, meaning1, meaning2, question, lesson, finding, caption), keeping the line breaks (\\n) as they should appear on screen.',
    ].join("\n");
  }
  const blocks = numbers.map((n) => {
    const s = state.shorts[n];
    const options = Object.entries(s.options)
      .map(([id, c]) => `  OPTION ${id}${id === "current" ? " (shipped)" : ""}:\n${showCopy(c)}${s.problems[id]?.length ? `\n      rule problems: ${s.problems[id].join("; ")}` : ""}`)
      .join("\n");
    const history = s.votes
      .map((v) => REVIEWERS.map((w) => (v[w] ? `  round ${v.round}, ${w === "opus" ? "Opus" : "Astra"}: chose ${v[w].choice}, score ${v[w].score}. ${v[w].reason}` : "")).filter(Boolean).join("\n"))
      .join("\n");
    return `${sections[n]}\nOptions:\n${options}\n\nWhat each reviewer said so far:\n${history}\n`;
  });
  return [
    context,
    `# Round ${round}`,
    "",
    "The two reviewers have not agreed on these shorts. For each, read the other reviewer's reasons, and choose the option you would ship: keep your choice if you still think it is best, move to the other's if it has convinced you, or write a new rewrite that meets both sets of reasons. Agreement means both of you choose the same option. Don't give way on a point you think matters to a viewer, and don't hold out over wording that is only different, not worse. The shipped copy wins a tie.",
    "",
    "The classic text is in series/critic/convergence/sources.json (key = hexagram number).",
    "",
    ...blocks,
    "Answer with JSON only, no other text:",
    '{"shorts": [{"number": 7, "choice": "current" | "<option id>" | "new", "score": 1-10 for the option you chose, "reason": "one or two sentences, answering the other reviewer", "rewrite": {"field": "new text", ...}}]}',
    'Give "rewrite" only with "new", with only the fields that differ from the shipped copy.',
  ].join("\n");
};

const run = (who, round, prompt, out) =>
  new Promise((resolve) => {
    const effort = effortOf(round);
    const [cmd, args, env] =
      who === "opus"
        ? ["claude", ["-p", "--model", "claude-opus-5-5", "--effort", effort, "--no-session-persistence", "--allowedTools", "Read", "--output-format", "text"], { ...process.env, CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" }]
        : ["codex", ["exec", "-m", "gpt-6-astra", "-c", `model_reasoning_effort="${effort}"`, "-s", "read-only", "--skip-git-repo-check", "-C", root, "-o", out, "-"], process.env];
    const child = spawn(cmd, args, { cwd: root, env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code) => {
      if (who === "opus") writeFileSync(out, stdout);
      resolve({ code, stderr: stderr.slice(-2000) });
    });
    child.stdin.end(prompt);
  });

const BATCH = 16;

const round = async (r) => {
  const state = JSON.parse(readFileSync(path.join(dir, "state.json"), "utf8"));
  if (state.rounds.includes(r)) throw new Error(`round ${r} already tallied`);
  const brief = readFileSync(path.join(dir, "brief.md"), "utf8");
  const open = Object.keys(state.shorts).filter((n) => !state.shorts[n].agreed);
  const batches = [];
  for (let i = 0; i < open.length; i += BATCH) batches.push(open.slice(i, i + BATCH));
  const rdir = path.join(dir, `round-${r}`);
  mkdirSync(rdir, { recursive: true });
  const votes = { opus: {}, astra: {} };
  await Promise.all(
    batches.flatMap((nums, b) =>
      REVIEWERS.map(async (who) => {
        const prompt = roundPrompt(r, nums, state, brief);
        writeFileSync(path.join(rdir, `prompt-${b + 1}.md`), prompt);
        const out = path.join(rdir, `${who}-${b + 1}.txt`);
        for (let attempt = 1; attempt <= 2; attempt++) {
          if (!existsSync(out) || !parseAnswer(readFileSync(out, "utf8"))) {
            const { code, stderr } = await run(who, r, prompt, out);
            console.log(`round ${r} ${who} batch ${b + 1}: exit ${code}${code ? ` ${stderr}` : ""}`);
          }
        }
        const answer = existsSync(out) ? parseAnswer(readFileSync(out, "utf8")) : null;
        if (!answer) return console.error(`round ${r} ${who} batch ${b + 1}: no JSON answer`);
        Object.assign(votes[who], votesOf(answer, r));
      }),
    ),
  );
  for (const who of REVIEWERS) {
    const missing = open.filter((n) => !votes[who][n]);
    if (missing.length) throw new Error(`${who} gave no vote on ${missing.join(", ")}; rerun round ${r} (answers already saved are reused)`);
  }
  tally(state, r, votes);
  state.rounds.push(r);
  writeFileSync(path.join(dir, "state.json"), JSON.stringify(state, null, 1));
  const agreed = Object.values(state.shorts).filter((s) => s.agreed);
  console.log(`round ${r}: ${agreed.length}/64 agreed (${agreed.filter((s) => s.agreed !== "current").length} on a rewrite), ${64 - agreed.length} open`);
};

const brief = () => {
  mkdirSync(dir, { recursive: true });
  const characters = Object.fromEntries(JSON.parse(readFileSync(path.join(root, "series/characters.json"), "utf8")).characters.map((c) => [c.number, c]));
  const scenes = sceneText();
  const depth = JSON.parse(readFileSync(path.join(root, "series/critic/depth/input.json"), "utf8")).shorts;
  const sources = Object.fromEntries(depth.map((d) => [d.number, d.classic]));
  const state = { rounds: [], shorts: {} };
  const out = ["# The 64 shorts, as a viewer meets them", ""];
  for (let n = 1; n <= 64; n++) {
    const { props } = record(n);
    const c = copyOf(props, post(n));
    out.push(timeline(n, props, c, { characters, scenes }));
    state.shorts[n] = { name: props.hexagram.name, readout: !!props.lesson?.readout, options: { current: c }, problems: { current: problemsOf(c, !!props.lesson?.readout) }, votes: [], agreed: null };
  }
  writeFileSync(path.join(dir, "brief.md"), out.join("\n"));
  writeFileSync(path.join(dir, "sources.json"), JSON.stringify(sources, null, 1));
  if (existsSync(path.join(dir, "state.json")) && JSON.parse(readFileSync(path.join(dir, "state.json"), "utf8")).rounds.length) {
    console.log("state.json has rounds; left as it is");
  } else writeFileSync(path.join(dir, "state.json"), JSON.stringify(state, null, 1));
  console.log(`wrote brief.md, sources.json and state.json in ${path.relative(root, dir)}`);
};

const report = () => {
  const state = JSON.parse(readFileSync(path.join(dir, "state.json"), "utf8"));
  const lines = ["# Copy convergence: Opus 5.5 and Astra, 2026-09-29", ""];
  lines.push(
    'The user: "do you think 8 or above is a good rubric, or should we just have them agree that the copy is good. basically we want fun, engaging, with clarity and of course following the text but we don\'t need to be following the text exactly if it can get us a dramtically better result." Then: "yes pelase set it up for agreement with high effort on the models initially, follow your recs".',
    "",
    `Method: scripts/convergence.mjs; context and rubric in series/critic/convergence/context.md; every prompt and answer in series/critic/convergence/round-N/. Rounds run: ${state.rounds.join(", ")}.`,
    "",
  );
  const entries = Object.entries(state.shorts);
  const changed = entries.filter(([, s]) => s.agreed && s.agreed !== "current");
  const kept = entries.filter(([, s]) => s.agreed === "current");
  const open = entries.filter(([, s]) => !s.agreed);
  const diff = (a, b) => FIELDS.filter((f) => a[f] !== b[f]).map((f) => `- ${f}: ${JSON.stringify(a[f])} → ${JSON.stringify(b[f])}`);
  const last = (s) => s.votes.at(-1);
  lines.push(`## Agreed changes (${changed.length})`, "");
  for (const [n, s] of changed) {
    const v = last(s);
    lines.push(`### ${n} ${s.name} (round ${v.round}, ${s.agreed})`, "", ...diff(s.options.current, s.options[s.agreed]), "", `Opus (${v.opus.score}): ${v.opus.reason}`, "", `Astra (${v.astra.score}): ${v.astra.reason}`, "");
    if (s.problems[s.agreed]?.length) lines.push(`Rule problems: ${s.problems[s.agreed].join("; ")}`, "");
  }
  lines.push(`## Agreed to keep (${kept.length})`, "", kept.map(([n, s]) => `${n} ${s.name} (${last(s).opus.score}/${last(s).astra.score})`).join(", "), "");
  lines.push(`## Still split (${open.length}): for the user`, "");
  for (const [n, s] of open) {
    const v = last(s);
    lines.push(`### ${n} ${s.name}`, "");
    for (const w of REVIEWERS) {
      const id = v[w].choice;
      lines.push(`${w === "opus" ? "Opus" : "Astra"} (${id}, ${v[w].score}): ${v[w].reason}`, "", ...(id === "current" ? ["- keep the shipped copy"] : diff(s.options.current, s.options[id])), "");
    }
  }
  const out = path.join(root, "docs/research/2026-09-29-copy-convergence.md");
  writeFileSync(out, lines.join("\n"));
  console.log(`wrote ${path.relative(root, out)}: ${changed.length} changes, ${kept.length} kept, ${open.length} split`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === "brief") brief();
  else if (cmd === "round") {
    const r = Number(arg);
    if (!(r >= 1 && r <= LAST_ROUND)) throw new Error(`round 1 to ${LAST_ROUND}`);
    await round(r);
  } else if (cmd === "report") report();
  else console.error("usage: node scripts/convergence.mjs brief | round N | report");
}
