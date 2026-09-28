// Queues one video post in Typefully from a spec in series/social/<name>.json: uploads the
// video, waits for it to process, and creates a draft scheduled at the spec's `publish_at`,
// the video on the first post of each platform it names. A dry run by default; LIVE=1 applies.
// The key comes from the environment (the set's owning repo keeps it), never from this repo:
//   node --env-file=../sixlines-site/.env scripts/social/queue-video.mjs series/social/<name>.json
//   LIVE=1 node --env-file=../sixlines-site/.env scripts/social/queue-video.mjs series/social/<name>.json
// The result (draft id, media id, links) is written beside the spec as <name>.queued.json.
// Media flow as in sixlines-site/scripts/typefully/attach-social-images.mjs (ADR-045).
import { execFileSync } from "node:child_process";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = "https://api.typefully.com/v2";
const root = path.resolve(import.meta.dirname, "../..");
const specPath = process.argv[2];
if (!specPath) throw new Error("usage: queue-video.mjs series/social/<name>.json");
const spec = JSON.parse(readFileSync(path.resolve(root, specPath), "utf8"));
const key = process.env.TYPEFULLY_API_KEY;
if (!key) throw new Error("TYPEFULLY_API_KEY is not set (run with --env-file from the set's repo)");
const H = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const video = path.resolve(root, spec.video);
const live = process.env.LIVE === "1";

const api = async (method, url, body) => {
  const res = await fetch(`${BASE}${url}`, { method, headers: H, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} failed ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
};

const set = await api("GET", `/social-sets/${spec.set}/`);
const quota = set.publishing_quota;
console.log(`set ${spec.set} ${set.name}; quota ${quota?.used}/${(quota?.used ?? 0) + (quota?.remaining ?? 0)} used`);
for (const [p, text] of Object.entries(spec.platforms)) {
  if (!set.platforms?.[p]) throw new Error(`${p} is not connected in set ${spec.set}`);
  console.log(`${p} (${set.platforms[p].username}): ${text.length} characters`);
}
const size = statSync(video).size;
console.log(`video ${spec.video}, ${(size / 1e6).toFixed(2)} MB; publish at ${spec.publish_at}`);
// Typefully's free plan refuses a video over 10 MB when the draft is created, after the upload.
const MAX_VIDEO = 10e6;
if (size > MAX_VIDEO) throw new Error(`video is over Typefully's 10 MB free-plan limit; re-encode it smaller`);
if (!live) {
  console.log("dry run: nothing uploaded or created (LIVE=1 to apply)");
  process.exit(0);
}

const { media_id, upload_url } = await api("POST", `/social-sets/${spec.set}/media/upload`, { file_name: path.basename(video), alt_text: spec.alt });
// A plain PUT of the bytes; an added Content-Type breaks the signed URL. curl, since fetch
// gives up after 5 min without response headers and a 23 MB upload here takes longer.
execFileSync("curl", ["--fail", "--silent", "--show-error", "-X", "PUT", "-H", "Content-Type:", "--upload-file", video, upload_url], { stdio: "inherit" });
let status;
for (let i = 0; i < 90 && status !== "ready"; i++) {
  await sleep(4000);
  status = (await api("GET", `/social-sets/${spec.set}/media/${media_id}`)).status;
  if (status === "failed") throw new Error(`media ${media_id} failed processing`);
}
if (status !== "ready") throw new Error(`media ${media_id} not ready after 6 min (last: ${status})`);
console.log(`media ${media_id} ready`);

const platforms = Object.fromEntries(Object.entries(spec.platforms).map(([p, text]) => [p, { enabled: true, posts: [{ text, media_ids: [media_id] }] }]));
const draft = await api("POST", `/social-sets/${spec.set}/drafts`, { platforms, draft_title: spec.title, publish_at: spec.publish_at });
const out = { draft_id: draft.id, media_id, scheduled_date: draft.scheduled_date, status: draft.status, private_url: draft.private_url, share_url: draft.share_url, created_at: draft.created_at };
writeFileSync(path.resolve(root, specPath.replace(/\.json$/, ".queued.json")), JSON.stringify(out, null, 1) + "\n");
console.log(out);
