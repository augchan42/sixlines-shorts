// The post caption for one short: the name, the author's personal note if there is one,
// the written caption from series/copy.json, the end card's tagline and the site, then hashtags (which live here only, never in the video).
const TAGS = ["#iching", "#bookofchanges", "#synthwave", "#sixlines"];

export const postCaption = (row) =>
  [
    `${row.number} · ${row.zh} ${row.pinyin} · ${row.name}`,
    row.copy.note,
    row.copy.caption.text,
    row.copy.lineage,
    "Reveal the moment. sixlines.day",
    [...TAGS, ...(row.copy.tags ?? [])].join(" "),
  ]
    .filter(Boolean)
    .join("\n\n") + "\n";

// The LinkedIn caption: the author's note first (a placeholder until they write it), the
// LinkedIn text if the copy has one (else the written caption), the site, and only the
// short's own hashtags, since the Instagram tag block and tagline read as Instagram there.
export const linkedinCaption = (row) =>
  [
    `${row.number} · ${row.zh} ${row.pinyin} · ${row.name}`,
    row.copy.note ?? "[your note]",
    (row.copy.linkedin ?? row.copy.caption).text,
    "sixlines.day",
    (row.copy.tags ?? ["#iching"]).join(" "),
  ].join("\n\n") + "\n";
