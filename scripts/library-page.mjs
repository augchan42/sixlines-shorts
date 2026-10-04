// The Shorts library page: every finished short from series/review/library.json, with the
// user's verdicts from the review board and the experiments tracker, and a posting schedule
// (status and a date per platform: TikTok, Instagram, YouTube Shorts) kept in the artifact's
// database, collection "schedule", one document per short id. The user, 2026-10-04: "we need a
// tracker to keep track of all the shorts we've made along with their revisions so far so we can
// have a posting schedule after our tik tok and instagram accounts are warmed up".
//
//   node scripts/library-page.mjs --verdicts <board reviews dir> <tracker reviews dir>
//       # snapshots the two artifacts' "reviews" collections (ArtifactData list with out_dir)
//       # into series/review/library-verdicts.json
//   node scripts/library-page.mjs   # writes series/review/library.html, published as the artifact
//       # https://claude.ai/artifact/VYg5jo9eGZRryhtPvFYZZb (capabilities db, user)
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const BOARD = "https://claude.ai/artifact/Dms7KJ2SULdsmBhUzsGyym";
const TRACKER = "https://claude.ai/artifact/Gkfv7F8c7vsJqBh15TNFpQ";
const VERDICTS = path.join(root, "series/review/library-verdicts.json");

function readDir(dir) {
  return Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
    .map((f) => [f.slice(0, -5), JSON.parse(readFileSync(path.join(dir, f), "utf8"))]));
}

// Board ids to library ids: short-NN and copy-NN are hexagram-NN; lesson-wangbi is wangbi-lesson.
// The board's astra-* and decide-* documents are about copy choices, not whole shorts.
export function boardTarget(id) {
  const m = id.match(/^(short|copy)-(\d\d)$/);
  if (m) return { id: `hexagram-${m[2]}`, kind: m[1] === "short" ? "short" : "copy" };
  if (id === "lesson-wangbi") return { id: "wangbi-lesson", kind: "short" };
  return null;
}

// One list of verdicts per library id: { from, kind, verdict, comment, at }.
export function mergeVerdicts(rows, snapshot) {
  const out = {};
  const push = (id, v) => { (out[id] ||= []).push(v); };
  for (const [doc, r] of Object.entries(snapshot.board)) {
    const t = boardTarget(doc);
    if (t) push(t.id, { from: "review board", kind: t.kind, verdict: r.verdict || "", comment: r.comment || "", at: r.updated || r.at || "" });
  }
  const byTracker = {};
  for (const row of rows) if (row.tracker?.id) (byTracker[row.tracker.id] ||= []).push(row.id);
  for (const [doc, r] of Object.entries(snapshot.tracker)) {
    for (const id of byTracker[doc] || (rows.some((x) => x.id === doc) ? [doc] : [])) {
      push(id, { from: "experiments tracker", kind: "short", verdict: r.verdict || "", comment: r.comment || "", at: r.at || r.updated || "" });
    }
  }
  for (const list of Object.values(out)) list.sort((a, b) => b.at.localeCompare(a.at));
  return out;
}

if (process.argv[2] === "--verdicts") {
  const [board, tracker] = process.argv.slice(3);
  const snapshot = {
    about: `The user's verdicts and comments, copied from the review board (${BOARD}) and the experiments tracker (${TRACKER}), collection "reviews" in each, for the Shorts library page.`,
    read: new Date().toISOString().slice(0, 10),
    board: readDir(board),
    tracker: readDir(tracker),
  };
  writeFileSync(VERDICTS, JSON.stringify(snapshot, null, 1) + "\n");
  console.log(`wrote ${path.relative(root, VERDICTS)}: ${Object.keys(snapshot.board).length} board, ${Object.keys(snapshot.tracker).length} tracker`);
} else if (import.meta.url === `file://${process.argv[1]}`) {
  const lib = JSON.parse(readFileSync(path.join(root, "series/review/library.json"), "utf8"));
  const snapshot = JSON.parse(readFileSync(VERDICTS, "utf8"));
  const verdicts = mergeVerdicts(lib.rows, snapshot);
  const rows = lib.rows.map((r) => ({
    id: r.id, title: r.title, series: r.series, account: r.account, kind: r.kind, why: r.why,
    file: r.file, exists: r.exists, sizeMB: r.sizeMB, seconds: r.seconds, caption: r.caption,
    current: r.current, revisions: r.revisions, userSaid: r.tracker?.userSaid || "", stage: r.tracker?.stage || "",
    notes: r.notes, verdicts: verdicts[r.id] || [],
  }));
  const data = { generated: lib.generated, verdictsRead: snapshot.read, rows, excluded: lib.excluded };
  const template = readFileSync(path.join(root, "scripts/library-page.html"), "utf8");
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  const out = path.join(root, "series/review/library.html");
  writeFileSync(out, template.replace("/*DATA*/null", () => json));
  console.log(`wrote ${path.relative(root, out)}: ${rows.length} shorts, ${Object.keys(verdicts).length} with verdicts`);
}
