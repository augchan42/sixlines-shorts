"""Small copies of the experiments tracker's videos (series/review/tracker.json), for its
artifact's asset store. The user, 2026-10-01: "the artifact also doesn't link to the actual
short videos, the issue is finding them on the disk".

    python3 scripts/tracker-media.py          # out/tracker/<item>-<n>.mp4, and out/tracker/list.json

Each .mp4 in an item's `files` gets a 540 px crf 30 copy (yuv420p, faststart). They are uploaded
to the artifact by hand (the Artifact tool, asset: true); the returned urls go back into
tracker.json as each item's `videos`, [{"path": <the file on disk>, "url": <asset url>}].
"""

import json
import os
import subprocess

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
out = os.path.join(root, "out/tracker")
os.makedirs(out, exist_ok=True)
tracker = json.load(open(os.path.join(root, "series/review/tracker.json")))
made = []
for it in tracker["items"]:
    for n, f in enumerate(x for x in it.get("files", []) if x.endswith(".mp4")):
        src = os.path.join(root, f)
        if not os.path.exists(src):
            continue
        dst = os.path.join(out, f"{it['id']}-{n}.mp4")
        if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", "scale=540:-2", "-c:v", "libx264", "-crf", "30",
                            "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "96k", dst], check=True)
        made.append({"item": it["id"], "path": f, "copy": os.path.relpath(dst, root), "mb": round(os.path.getsize(dst) / 1e6, 1)})
json.dump(made, open(os.path.join(out, "list.json"), "w"), indent=1)
print(len(made), "videos,", round(sum(m["mb"] for m in made), 1), "MB; largest", max(m["mb"] for m in made), "MB")
