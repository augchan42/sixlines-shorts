// The post caption for one short: the name, the written caption from series/copy.json,
// the end card's tagline and the site, then hashtags (which live here only, never in the video).
const TAGS = ["#iching", "#bookofchanges", "#synthwave", "#sixlines"];

export const postCaption = (row) =>
  [
    `${row.number} · ${row.zh} ${row.pinyin} · ${row.name}`,
    row.copy.caption.text,
    row.copy.lineage,
    "Reveal the moment. sixlines.day",
    TAGS.join(" "),
  ]
    .filter(Boolean)
    .join("\n\n") + "\n";
