import assert from "node:assert/strict";
import test from "node:test";
import { postCaption } from "../scripts/series/caption.mjs";

test("the post caption names the hexagram, links the site and has 3 to 5 hashtags", () => {
  const c = postCaption({ number: 29, zh: "坎", pinyin: "Kǎn", name: "The Abyss", commentary: "Danger doubled.", copy: { lineage: "Jung called it synchronicity." } });
  assert.match(c, /^29 · 坎 Kǎn · The Abyss/);
  assert.match(c, /Danger doubled\./);
  assert.match(c, /Jung called it synchronicity\./);
  assert.match(c, /sixlines\.day/);
  const tags = c.match(/#\w+/g);
  assert.ok(tags.length >= 3 && tags.length <= 5);
});
