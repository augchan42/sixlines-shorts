import assert from "node:assert/strict";
import test from "node:test";
import { BAR, CUTS, REIGNS, SHOTS, cardsFilter, fitBitrate, musicStart, timeline } from "../scripts/wuyue.mjs";

const BANNED = ["oracle", "divination", "fortune", "prediction", "mystical", "magical"];

test("every shot is a whole number of bars and the video runs about 98 s", () => {
  for (const s of SHOTS) assert.ok(Number.isInteger(s.bars), s.name);
  const secs = SHOTS.reduce((t, s) => t + s.bars * BAR, 0);
  assert.ok(secs > 90 && secs < 105, String(secs));
});

test("each shot's events fall inside it", () => {
  for (const s of SHOTS) {
    const len = s.bars * BAR + 1e-9;
    for (const [k, v] of Object.entries(s.events)) for (const t of [v].flat()) assert.ok(t >= 0 && t <= len, `${s.name}.${k}`);
  }
});

test("cards: inside their shot, in order, at least 2 s each, short lines, plain words", () => {
  for (const s of SHOTS) {
    const len = s.bars * BAR + 1e-9;
    s.cards.forEach((c, i) => {
      assert.ok(c.from >= 0 && c.to <= len && c.to - c.from >= 2, `${s.name}: ${c.text}`);
      if (i) assert.ok(c.from >= s.cards[i - 1].to, `${s.name}: ${c.text}`);
      for (const line of c.text.split("\n")) assert.ok(line.length <= 34, `too long for a phone: ${line}`);
      for (const w of BANNED) assert.ok(!c.text.toLowerCase().includes(w), c.text);
    });
  }
});

test("the timeline has one span per reign, 907 to 978, each as long as its reign", () => {
  assert.equal(REIGNS[0][0], 907);
  assert.equal(REIGNS.at(-1)[1], 978);
  const spans = timeline(16, 0.25);
  assert.equal(spans.length, 5);
  assert.equal(spans[0][0], -8);
  assert.equal(spans.at(-1)[1].toFixed(6), (8).toFixed(6));
  const ratio = (spans[4][1] - spans[4][0]) / (spans[0][1] - spans[0][0]);
  assert.equal(ratio.toFixed(3), ((978 - 948) / (932 - 907)).toFixed(3));
});

test("each cut sets its frame; the map is the same for both (tests/wuyue-map.test.mjs)", () => {
  assert.deepEqual(CUTS.vertical.size, [1080, 1920]);
  assert.deepEqual(CUTS.wide.size, [1920, 1080]);
  for (const c of Object.values(CUTS)) assert.equal(c.korea, undefined);
});

test("a card's lines are drawn one under another, centred, fading, each read from a file", () => {
  const { filter, files } = cardsFilter([{ text: "978: Qian Chu surrendered\nWuyue to the Song.", from: 0.3, to: 4.6 }], CUTS.vertical, "/f/goudos.ttf", "/d", 10);
  assert.equal(filter.split("drawtext").length - 1, 2);
  assert.deepEqual(files.map(([, t]) => t), ["978: Qian Chu surrendered", "Wuyue to the Song."]);
  for (const [f] of files) assert.ok(filter.includes(`textfile='${f}'`) && f.startsWith("/d/"));
  assert.match(filter, /x=\(w-text_w\)\/2/);
  assert.match(filter, /enable='between\(t,10.3,14.6\)'/);
  assert.equal(cardsFilter([{ text: "it's", from: 0, to: 2 }], CUTS.vertical, "/f", "/d").files[0][1], "it’s");
});

test("the music starts so the exchange's flare lands on the drop", () => {
  const m = { start: 158.426, drop: 14.4 };
  const flareAt = SHOTS.slice(0, 2).reduce((t, s) => t + s.bars * BAR, 0) + SHOTS[2].events.flare;
  assert.equal((musicStart(m) + flareAt).toFixed(3), (158.426 + 14.4).toFixed(3));
});

test("the Instagram bitrate keeps 98.4 s of video and audio under 24 MB", () => {
  const kbps = fitBitrate(98.4);
  assert.ok(((kbps + 192) * 98.4) / 8e3 < 24 && kbps > 1500, String(kbps));
});
