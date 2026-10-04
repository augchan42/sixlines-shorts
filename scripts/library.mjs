// Writes series/review/library.json: every finished short this repo has made, one row each,
// with its delivered file, caption and revision history, for planning a posting schedule
// (the user, 2026-10-04: 'we need a tracker to keep track of all the shorts we've made along
// with their revisions so far so we can have a posting schedule after our tik tok and instagram
// accounts are warmed up'). Another page is built from this data.
//
// Sources: render records (series/renders/**), the scripts they were built from (series/**),
// the experiments tracker (series/review/tracker.json), git history and out/** (media is not in
// git: out/ is a symlink to the main checkout). A revision is a commit that touched the short's
// render record; shorts without one (Guides, Urizen, neon forms, Wuyue) count commits to their
// script, named in revisionsFrom. Plain `git log`, not --follow: git's copy detection links new
// records to older look-alikes (horse-2 to 02, character-42 to 42) that are not their history.
// Everything not taken is listed in "excluded" with a reason; doubtful rows have kind "unsure".
// The verdicts on the review board live in the artifact's database, so "verdict" stays null.
//   node scripts/library.mjs
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const abs = (p) => path.join(root, p);
const json = (p) => JSON.parse(readFileSync(abs(p), "utf8"));
const text = (p) => (existsSync(abs(p)) ? readFileSync(abs(p), "utf8").trim() : null);
const list = (dir, ext = ".json") =>
  readdirSync(abs(dir))
    .filter((f) => f.endsWith(ext) && !f.endsWith(".props.json"))
    .map((f) => f.slice(0, -ext.length))
    .sort();

const tracker = Object.fromEntries(json("series/review/tracker.json").items.map((i) => [i.id, i]));

function revisions(paths) {
  const out = execFileSync("git", ["log", "--format=%H%x09%cs%x09%s", "--", ...paths], {
    cwd: root,
    encoding: "utf8",
  });
  return out
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [commit, date, ...subject] = l.split("\t");
      return { commit, date, subject: subject.join("\t") };
    });
}

function seconds(file, recorded) {
  if (typeof recorded === "number") return Math.round(recorded * 100) / 100;
  if (!existsSync(abs(file))) return null;
  const s = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", abs(file)],
    { encoding: "utf8" },
  );
  return Math.round(Number(s) * 100) / 100;
}

// The first file that exists, else the first named (so a missing file still shows its path).
const pick = (...files) => files.find((f) => existsSync(abs(f))) ?? files[0];

function account(script) {
  if (!script || !existsSync(abs(script))) return "Six Lines";
  return json(script).brand?.header === "8-BIT ORACLE" ? "8-Bit Oracle" : "Six Lines";
}

function trackerNote(id) {
  const t = tracker[id];
  if (!t) return null;
  return { id, stage: t.stage, userSaid: t.userSaid || null };
}

function row({ id, title, series, file, recordSeconds, caption, sourceScript, revisionsFrom, kind = "short", why = null, trackerId = null, notes = [] }) {
  const exists = existsSync(abs(file));
  const revs = revisions(revisionsFrom);
  const script = sourceScript && existsSync(abs(sourceScript)) ? json(sourceScript) : null;
  return {
    id,
    title,
    series,
    account: account(sourceScript),
    kind,
    why,
    file,
    exists,
    sizeMB: exists ? Math.round((statSync(abs(file)).size / 1e6) * 100) / 100 : null,
    seconds: seconds(file, recordSeconds),
    caption: caption ?? (typeof script?.caption === "string" ? script.caption : null),
    current: revs[0] ?? null,
    revisions: revs,
    revisionCount: revs.length,
    revisionsFrom,
    sourceScript,
    tracker: trackerNote(trackerId),
    verdict: null,
    notes,
  };
}

const rows = [];
const excluded = [];
const exclude = (id, source, reason) => excluded.push({ id, source, reason });

// 64 hexagram shorts: series/renders/NN.json, built from series/hexagrams.json.
for (const nn of list("series/renders").filter((n) => /^\d\d$/.test(n))) {
  const rec = `series/renders/${nn}.json`;
  const r = json(rec);
  const dir = Object.keys(r.files).find((k) => k.startsWith("out/series/")).split("/").slice(0, 3).join("/");
  const caption = text(`series/renders/${nn}.txt`);
  const h = r.props.hexagram;
  rows.push(
    row({
      id: `hexagram-${nn}`,
      title: caption?.split("\n")[0] ?? `${h.number} · ${h.zh} ${h.pinyin} · ${h.name}`,
      series: "64 hexagrams",
      file: `${dir}/share.mp4`,
      recordSeconds: r.seconds,
      caption,
      sourceScript: "series/hexagrams.json",
      revisionsFrom: [rec],
      notes: [`Lesson: ${r.props.lesson?.kind ?? "none"}.`],
    }),
  );
}

// Specials: series/renders/specials/<id>.json, built from series/specials/<id>.json.
const folded = { "bite-21": 21, "readout-21": 21, "readout-14": 14, "bird-62": 62 };
const specialTitle = { "horse-2": "Horse (馬, horse) on 2", "mid-autumn-2026-b": "Mid-Autumn 2026 (moon, version B)", "bite-21": "Bite (21)", "readout-21": "Nostromo readout (21)", "readout-14": "Readout with Wang Bi (14)", "bird-62": "Bird (62)" };
for (const id of list("series/renders/specials")) {
  const rec = `series/renders/specials/${id}.json`;
  const r = json(rec);
  const src = `series/specials/${id}.json`;
  if (id.startsWith("trigram-") || id === "collapse-3d-23" || id === "judgment-3d-10") {
    const t = tracker[id] ?? tracker["trigram-60-tests"];
    exclude(id, rec, `style test (${t?.stage ?? "test"}): ${t?.userSaid || "no verdict"}`);
    continue;
  }
  if (id === "mid-autumn-2026") {
    exclude(id, rec, "version A of the Mid-Autumn short; version B (mid-autumn-2026-b) is the one sent again for posting");
    continue;
  }
  const caption = text(`series/renders/specials/${id}.txt`);
  const head = caption?.split("\n")[0];
  const character = id.startsWith("character-");
  let kind = "short";
  let why = null;
  if (character) {
    kind = "unsure";
    why = `earlier cut: series short ${r.hexagram} now carries the same neon character lesson, so this is likely a duplicate of hexagram-${String(r.hexagram).padStart(2, "0")}`;
  } else if (folded[id]) {
    kind = "unsure";
    why = `approved style test; its style went into series short ${folded[id]}, so it may duplicate hexagram-${String(folded[id]).padStart(2, "0")}`;
  }
  const notes = [];
  if (id === "horse-2") notes.push("Alternative cut of hexagram 2 (the series short has the lines lesson). Also out/specials/horse-2/neon-ma.mp4 and neon-ma-hold.mp4: the character alone, 10.7 s and 18.7 s.");
  if (id.startsWith("mid-autumn")) notes.push("Seasonal: Mid-Autumn Festival (2026-09-25 this year); 20 Contemplation.");
  rows.push(
    row({
      id,
      title: specialTitle[id] ?? (character ? `Character lesson: ${head}` : head ?? id),
      series: "Specials",
      file: `out/specials/${id}/share.mp4`,
      recordSeconds: r.seconds,
      caption,
      sourceScript: existsSync(abs(src)) ? src : null,
      revisionsFrom: [rec],
      kind,
      why,
      trackerId: character ? "character-specials" : id.startsWith("mid-autumn") ? "mid-autumn-2026" : id,
      notes,
    }),
  );
}

// Explainers: lessons, structure shorts and timeline paths.
const explainerTitle = {
  "timeline-answering": "Timeline path 3: Who is answering",
  "structure-timeline": "Structure: 3,000 years (fly-through)",
};
for (const id of list("series/renders/explainers")) {
  const rec = `series/renders/explainers/${id}.json`;
  const r = json(rec);
  if (/-pages-[\d-]+$/.test(id)) {
    exclude(id, rec, "partial render (some pages only), a smoke test of the full short");
    continue;
  }
  if (id.startsWith("wangbi-flight-")) {
    exclude(id, rec, "flight-look or cue test for the Wang Bi lesson, not a short");
    continue;
  }
  if (id === "readout-key") {
    exclude(id, rec, `dropped, replaced by the Wang Bi lesson (the user: '${tracker["readout-key"].userSaid}')`);
    continue;
  }
  const src = `series/explainers/${id}.json`;
  let file = pick(`out/explainers/${id}/${id}-720.mp4`, `out/explainers/${id}/share.mp4`);
  let series = "Lessons & explainers";
  let kind = "short";
  let why = null;
  if (id.startsWith("structure-")) series = "Structure";
  if (id.startsWith("timeline-")) {
    series = "Timeline paths";
    file = pick(`out/timeline/${id}-720p.mp4`, file);
  }
  if (id === "structure-timeline") {
    file = pick("out/timeline/structure-timeline-flight-720p.mp4", file);
    kind = "unsure";
    why = "rendered to judge the motion with the old copy (its commit says so); the tracker still has it at smoke test, and the timeline paths shorts grew from it";
  }
  const notes = [];
  if (id === "wangbi-lesson") notes.push("Posted (tracker stage); series/social/2026-09-28-wangbi-lesson*.json hold the Typefully posts for Six Lines and 8-Bit Oracle.");
  rows.push(
    row({
      id,
      title: explainerTitle[id] ?? tracker[id]?.title ?? id,
      series,
      file,
      recordSeconds: r.seconds,
      caption: null,
      sourceScript: existsSync(abs(src)) ? src : null,
      revisionsFrom: [rec],
      kind,
      why,
      trackerId: id,
      notes,
    }),
  );
}
for (const id of list("series/explainers")) {
  if (existsSync(abs(`series/renders/explainers/${id}.json`)) || /-pages-/.test(id)) continue;
  const reason =
    id === "timeline-paths"
      ? "shared data for the three timeline paths shorts, not a short itself"
      : `script only, never rendered as a full short${tracker[id] ? ` (tracker: ${tracker[id].stage})` : ""}`;
  exclude(id, `series/explainers/${id}.json`, reason);
}

// Bookends: hexagram shorts with the ivory open and close cards.
for (const id of list("series/renders/bookend")) {
  const rec = `series/renders/bookend/${id}.json`;
  const r = json(rec);
  const nn = id.slice(0, 2);
  const head = text(`series/renders/${nn}.txt`)?.split("\n")[0];
  const icon = id.endsWith("-icon");
  rows.push(
    row({
      id: `bookend-${id}`,
      title: `Bookend${icon ? " (app icon close)" : ""}: ${head}`,
      series: "Bookends",
      file: `out/bookend/${id}/share.mp4`,
      recordSeconds: r.seconds,
      caption: text(`series/renders/${nn}.txt`),
      sourceScript: `series/bookend/${id}.json`,
      revisionsFrom: [rec],
      trackerId: icon ? "bookend-kun" : "bookend-launch",
      notes: [`Another cut of hexagram-${nn} (${r.short}) with bookend cards: post one or the other. Caption is the hexagram short's.`],
    }),
  );
}

// App demo walkthrough, English and Chinese.
const demoTitle = { walkthrough: "App demo walkthrough (English)", "walkthrough-zh-hans": "App demo walkthrough (Simplified Chinese)", "walkthrough-zh-hant": "App demo walkthrough (Traditional Chinese)" };
for (const id of list("series/renders/demo")) {
  const rec = `series/renders/demo/${id}.json`;
  rows.push(
    row({
      id: `demo-${id}`,
      title: demoTitle[id] ?? id,
      series: "App demo",
      file: `out/demo/${id}/share.mp4`,
      recordSeconds: json(rec).seconds,
      caption: null,
      sourceScript: `series/demo/${id}.json`,
      revisionsFrom: [rec],
      trackerId: "demo-walkthrough",
    }),
  );
}

// Voice takes are audio for the Guide and Urizen shorts, not shorts.
for (const id of list("series/renders/voice")) exclude(`voice/${id}`, `series/renders/voice/${id}.json`, "voice take (narration audio for a Guide or Urizen short)");

// Guide shorts and Urizen: no render record; the script and its props are the history.
for (const id of list("series/specials").filter((n) => n.startsWith("guide-") || n === "urizen-qian6")) {
  if (id === "guide-sfx") {
    exclude(id, "series/specials/guide-sfx.json", "sound inventory for the Guide device, not a short");
    continue;
  }
  const src = `series/specials/${id}.json`;
  const props = `series/specials/${id}.props.json`;
  const urizen = id === "urizen-qian6";
  const file = urizen ? "out/urizen/urizen-qian6-card-720.mp4" : `out/guide/${id}-720.mp4`;
  rows.push(
    row({
      id,
      title: tracker[id]?.title ?? id,
      series: "Guides",
      file,
      caption: null,
      sourceScript: src,
      revisionsFrom: [src, ...(existsSync(abs(props)) ? [props] : [])],
      trackerId: id,
      notes: urizen ? ["Latest cut, with the ENTRY: URIZEN card. Earlier cuts out/urizen/urizen-qian6-720.mp4 and urizen-qian6-chyen-720.mp4 are superseded."] : [],
    }),
  );
}
exclude("guide-wangbi smoke tests", "out/guide/smoke-b1-3-720.mp4, out/guide/smoke-retro-b1-3-720.mp4", "smoke tests of lines 1-3 of the Wang Bi guide");

// Neon script forms: short clips with no music, samples for the user.
const formGloss = { 馬: ["ma", "horse"], 困: ["kun", "hardship"], 鼎: ["ding", "cauldron"], 井: ["jing", "well"], 家: ["jia", "family"], 革: ["ge", "revolution, molting"] };
for (const c of list("series/forms")) {
  const [slug, en] = formGloss[c] ?? [c, c];
  const src = `series/forms/${c}.json`;
  rows.push(
    row({
      id: `forms-${slug}`,
      title: `${c} (${en}) through its scripts`,
      series: "Specials",
      file: `out/forms/${c}-share.mp4`,
      caption: null,
      sourceScript: src,
      revisionsFrom: [src],
      kind: "unsure",
      why: "a sample clip (11-15 s, no music, no end card), sent to the user but not cut as a short",
      trackerId: "neon-forms",
    }),
  );
}

// Wuyue Kingdom video: vertical cut for Instagram (the wide cut is for a friend's site).
rows.push(
  row({
    id: "wuyue-vertical",
    title: "吳越 Wuyue Kingdom: a neon history (vertical)",
    series: "Specials",
    file: "out/wuyue/wuyue-vertical.mp4",
    caption: null,
    sourceScript: "series/wuyue-map.json",
    revisionsFrom: ["series/wuyue-map.json", "scripts/wuyue.mjs", "blender/wuyue.py"],
    kind: "unsure",
    why: "made at the user's request for Instagram and a friend's site; Wuyue history, not I-Ching, so neither account is certain",
    trackerId: "wuyue-video",
    notes: ["The wide cut out/wuyue/wuyue-wide-24mb.mp4 (104 s, sources card) is for the friend's site."],
  }),
);

// Media that is not a short, with the reason.
exclude("neon-signs", "series/signs/*.json, out/signs/*.mp4", "name signs (吳越, 馮 Fung, 陳 Chan, 梁 Leung) made as stills and clips for people, not shorts");
exclude("glowline-qian", "out/sixlines-glowline-720p.mp4, out/gotchu-qian*.mp4", "shared with Glowline only, not for posting without their permission");
exclude("style-reels", "out/reels/*.mp4", "back-to-back review reels of series shorts, not shorts");
exclude("terminal-godot", "out/terminal/7-army-share.mp4", "clip of the dropped Godot terminal");
exclude("prototypes", "out/prototype-series-*.mp4, out/qian*.mp4, out/before/, out/compare/", "early prototypes and before/after comparisons, superseded by the 64 series shorts");
exclude("series versions", "out/series/versions/, out/explainers/versions/, out/specials/versions/", "earlier renders kept for comparison; each short's history is its revisions");

rows.sort((a, b) => a.id.localeCompare(b.id));
excluded.sort((a, b) => a.id.localeCompare(b.id));

const ids = new Set();
for (const r of rows) {
  if (ids.has(r.id)) throw new Error(`duplicate id ${r.id}`);
  ids.add(r.id);
  if (!r.revisionCount) throw new Error(`${r.id} has no revision`);
}

const generated = rows.flatMap((r) => r.revisions.map((v) => v.date)).sort().at(-1);
const count = (key) => Object.fromEntries([...new Set(rows.map((r) => r[key]))].sort().map((k) => [k, rows.filter((r) => r[key] === k).length]));
const library = {
  about:
    "Every finished short with its delivered file and revision history, for the posting schedule (the user, 2026-10-04: 'we need a tracker to keep track of all the shorts we've made along with their revisions so far so we can have a posting schedule after our tik tok and instagram accounts are warmed up'). Written by scripts/library.mjs. A revision is a commit to the render record (or, with no record, to the files in revisionsFrom). kind 'unsure' rows say why; 'excluded' lists what is left out and why. verdict is null: the review board's verdicts live in its artifact database.",
  generated,
  counts: { rows: rows.length, bySeries: count("series"), byAccount: count("account"), byKind: count("kind"), excluded: excluded.length },
  rows,
  excluded,
};
writeFileSync(abs("series/review/library.json"), `${JSON.stringify(library, null, 1)}\n`);
console.log(`wrote series/review/library.json (${rows.length} rows, ${excluded.length} excluded)`);
console.log(JSON.stringify(library.counts));
const missing = rows.filter((r) => !r.exists).map((r) => r.file);
if (missing.length) console.log(`missing files: ${missing.join(", ")}`);
