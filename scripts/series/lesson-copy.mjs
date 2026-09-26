// A lesson from series/lessons.json as the copy.json lesson a short renders (src/series/props.ts).
// A character lesson takes its drawing from series/characters.json. A painting lesson needs its
// painting and the Library's painting page in public/. A line lesson has no picture yet, so
// it is refused.
export const lessonCopy = ({ number, kind, text, source }, characters, { exists = () => true } = {}) => {
  if (kind === "line") throw new Error(`${number}: a line lesson has no picture yet`);
  if (kind === "painting") {
    const missing = [`assets/paintings/${number}.jpg`, `assets/screens/${number}/painting-scrolled.png`].filter((f) => !exists(f));
    if (missing.length) throw new Error(`${number}: the painting lesson needs ${missing.join(" and ")}`);
  }
  if (kind !== "character") return { kind, text, source };
  const c = characters.find((x) => x.number === number);
  if (!c) throw new Error(`${number}: no character in series/characters.json`);
  return { kind, text, source, character: { char: c.char, beats: c.beats, args: c.args } };
};
