// The post caption for one short. Hashtags live here only, never in the video.
const TAGS = ["#iching", "#bookofchanges", "#synthwave", "#sixlines"];

export const postCaption = (row) =>
  [
    `${row.number} · ${row.zh} ${row.pinyin} · ${row.name}`,
    row.commentary,
    row.copy?.lineage,
    "Explore the I-Ching for free: sixlines.day",
    TAGS.join(" "),
  ]
    .filter(Boolean)
    .join("\n\n") + "\n";
