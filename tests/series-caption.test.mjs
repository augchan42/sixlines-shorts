import assert from "node:assert/strict";
import test from "node:test";
import { postCaption } from "../scripts/series/caption.mjs";

const row = {
  number: 29, zh: "坎", pinyin: "Kǎn", name: "The Abyss", commentary: "Danger doubled.",
  copy: { caption: { text: "One problem after another? Water fills the hole, then flows on.", source: "written" } },
};

test("the post caption is the written caption between the name and the tagline", () => {
  const c = postCaption(row);
  assert.match(c, /^29 · 坎 Kǎn · The Abyss\n\nOne problem after another\? Water fills the hole, then flows on\.\n\nReveal the moment\. sixlines\.day\n\n#/);
});

test("the post caption does not use the raw commentary or say free", () => {
  const c = postCaption(row);
  assert.doesNotMatch(c, /Danger doubled/);
  assert.doesNotMatch(c, /free/i);
});

test("a personal note goes first, under the name, in the author's own words", () => {
  const c = postCaption({ ...row, copy: { ...row.copy, note: "I cast this one the week the roof leaked." } });
  assert.match(c, /^29 · 坎 Kǎn · The Abyss\n\nI cast this one the week the roof leaked\.\n\nOne problem after another\?/);
});

test("the post caption has 3 to 5 hashtags", () => {
  const tags = postCaption(row).match(/#\w+/g);
  assert.ok(tags.length >= 3 && tags.length <= 5);
});
