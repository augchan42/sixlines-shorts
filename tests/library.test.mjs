import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const library = JSON.parse(readFileSync(new URL("../series/review/library.json", import.meta.url), "utf8"));
const rows = library.rows;

test("library ids are unique", () => {
  const ids = rows.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("no partial renders, flight tests or voice takes are rows", () => {
  for (const r of rows) {
    assert.doesNotMatch(r.id, /-pages-|wangbi-flight-|^voice\//, r.id);
    assert.doesNotMatch(r.file, /-pages-/, r.id);
  }
});

test("every row has a revision, newest first, and current is the newest", () => {
  for (const r of rows) {
    assert.ok(r.revisionCount > 0, r.id);
    assert.equal(r.revisionCount, r.revisions.length, r.id);
    assert.deepEqual(r.current, r.revisions[0], r.id);
    const dates = r.revisions.map((v) => v.date);
    assert.deepEqual(dates, [...dates].sort().reverse(), r.id);
  }
});

test("the 64 hexagram shorts are all present", () => {
  const hex = rows.filter((r) => r.series === "64 hexagrams").map((r) => r.id);
  const want = Array.from({ length: 64 }, (_, i) => `hexagram-${String(i + 1).padStart(2, "0")}`);
  assert.deepEqual(hex.sort(), want);
});

test("timeline-answering is on the 8-Bit Oracle account", () => {
  assert.equal(rows.find((r) => r.id === "timeline-answering")?.account, "8-Bit Oracle");
});

test("unsure rows say why, and exclusions give a reason", () => {
  for (const r of rows.filter((r) => r.kind === "unsure")) assert.ok(r.why, r.id);
  for (const e of library.excluded) assert.ok(e.reason, e.id);
});
