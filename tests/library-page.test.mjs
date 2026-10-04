import assert from "node:assert/strict";
import test from "node:test";
import { boardTarget, mergeVerdicts } from "../scripts/library-page.mjs";

test("board ids map to library ids", () => {
  assert.deepEqual(boardTarget("short-07"), { id: "hexagram-07", kind: "short" });
  assert.deepEqual(boardTarget("copy-26"), { id: "hexagram-26", kind: "copy" });
  assert.deepEqual(boardTarget("lesson-wangbi"), { id: "wangbi-lesson", kind: "short" });
  assert.equal(boardTarget("astra-22-app"), null);
  assert.equal(boardTarget("decide-says"), null);
});

test("verdicts merge from both artifacts, newest first", () => {
  const rows = [{ id: "hexagram-07" }, { id: "guide-leibniz", tracker: { id: "guide-leibniz" } }, { id: "horse-2", tracker: null }];
  const out = mergeVerdicts(rows, {
    board: { "short-07": { verdict: "change", comment: "low", updated: "2026-09-29T10:00:00Z" }, "copy-07": { verdict: "good", updated: "2026-09-30T10:00:00Z" } },
    tracker: { "guide-leibniz": { verdict: "change", at: "2026-10-01T02:00:00Z" }, "horse-2": { verdict: "good", at: "2026-10-01T03:00:00Z" }, "not-a-row": { verdict: "good" } },
  });
  assert.deepEqual(out["hexagram-07"].map((v) => v.kind), ["copy", "short"]);
  assert.equal(out["guide-leibniz"][0].from, "experiments tracker");
  assert.equal(out["horse-2"][0].verdict, "good");
  assert.equal(out["not-a-row"], undefined);
});
