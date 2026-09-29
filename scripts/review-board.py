"""Builds the review board: one page with everything waiting on the user's review, published as
an artifact. The user, 2026-09-27: "There's too many videos and styles and types spread all over
the place for me to review. Create a nice artifact that's organized properly, with an easy way
for me to check off that it's been reviewed with some comments."

    python3 scripts/review-board.py media   # small video copies and posters in out/review/
    python3 scripts/review-board.py page    # out/review/index.html from the template

`media` makes a 540 px crf 30 copy of each short's share.mp4 (yuv420p, faststart) and a poster
frame, named by what they are. They are uploaded to the artifact's asset store by hand (the
Artifact tool), and the returned urls are written to out/review/assets.json as
{"<file name>": "<url>"}. `page` reads that map, so a file not uploaded yet shows no player.

What the board says besides the shorts (the new work, Astra's critiques, open decisions) is data
in series/review/board.json. Verdicts and comments live in the artifact's database, collection
"reviews", one document per item id; the page is only the view.
"""

import json
import re
import os
import subprocess
import sys

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
out = os.path.join(root, "out/review")
media = os.path.join(out, "media")
rows = json.load(open(os.path.join(root, "series/hexagrams.json")))
board = json.load(open(os.path.join(root, "series/review/board.json")))


def rel(*p):
    return os.path.join(root, *p)


def short_dir(n):
    return next(d for d in sorted(os.listdir(rel("out/series"))) if d.startswith(f"{n:02d}-"))


def style(copy):
    lesson = copy["lesson"]
    if lesson["kind"] == "character":
        return "Character"
    return "Readout" if "readout" in lesson else "Scene"


def track(file):
    # local/music/pick13-synthwave-the-mountain.mp3 -> synthwave the mountain
    name = os.path.splitext(os.path.basename(file))[0]
    return name.split("-", 1)[1].replace("-", " ") if name.startswith("pick") else name


def encode(src, dst, poster, at):
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", "scale=540:-2", "-c:v", "libx264", "-crf", "30",
                        "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "128k", dst], check=True)
    if not os.path.exists(poster) or os.path.getmtime(poster) < os.path.getmtime(src):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(at), "-i", src, "-frames:v", "1", "-vf", "scale=270:-2", "-q:v", "5", poster], check=True)


def shorts():
    items = []
    for r in rows:
        n = r["number"]
        rec = json.load(open(rel(f"series/renders/{n:02d}.json")))
        p = rec["props"]
        c = r["copy"]
        items.append({
            "id": f"short-{n:02d}",
            "number": n,
            "name": r["name"],
            "zh": r["zh"],
            "pinyin": r["pinyin"],
            "style": style(c),
            "hook": c["hook"]["text"],
            "meaning": [m["text"] for m in c["meaning"]],
            "question": c["question"]["text"],
            "lesson": c["lesson"]["text"],
            "bpm": p["bpm"],
            "track": track(p["music"]),
            "seconds": round(rec["seconds"], 1),
            "newCard": bool(c.get("endcardRef")),
            "rendered": rec["rendered"][:10],
            "commit": rec["commit"][:7],
            "video": f"short-{n:02d}.mp4",
            "poster": f"short-{n:02d}.jpg",
            "src": f"out/series/{short_dir(n)}/share.mp4",
            "posterAt": round(rec["seconds"] * 0.55, 2),
        })
    return items


def build_media():
    os.makedirs(media, exist_ok=True)
    items = shorts()
    lesson = board["new"]["lesson"]
    jobs = [(i["src"], i["video"], i["poster"], i["posterAt"]) for i in items]
    jobs.append((lesson["video"], "lesson-wangbi.mp4", "lesson-wangbi.jpg", 60))
    for k, (src, video, poster, at) in enumerate(jobs, 1):
        encode(rel(src), os.path.join(media, video), os.path.join(media, poster), at)
        print(f"{k}/{len(jobs)} {video} {os.path.getsize(os.path.join(media, video)) / 1e6:.1f} MB", flush=True)


FIELDS = ["hook", "meaning1", "meaning2", "question", "lesson", "finding", "caption"]


def copy_review():
    """The copy convergence (scripts/convergence.mjs): the changes Opus and Astra agreed on, and
    the shorts still split after the last round, each with both versions, for the user to call."""
    state = json.load(open(rel("series/critic/convergence/state.json")))
    glosses = json.load(open(rel("series/critic/convergence/glosses.json")))["glosses"]
    quoted = re.compile("|".join(re.escape(k) for k in sorted(glosses, key=len, reverse=True)))

    def english(reason):
        # The user doesn't read Chinese: each quoted phrase gets its English beside it.
        return quoted.sub(lambda m: f"{m.group(0)} [{glosses[m.group(0)]}]", reason)

    def diffs(n, option):
        cur, new = state["shorts"][n]["options"]["current"], state["shorts"][n]["options"][option]
        return [[f, cur[f], new[f]] for f in FIELDS if cur[f] != new[f]]

    changes, splits, kept = [], [], []
    for n, s in state["shorts"].items():
        last = s["votes"][-1]
        if s["agreed"] == "current":
            kept.append(int(n))
        elif s["agreed"]:
            changes.append({"id": f"copy-{int(n):02d}", "number": int(n), "name": s["name"], "round": last["round"], "diffs": diffs(n, s["agreed"]),
                            "reasons": [[w, last[w]["score"], english(last[w]["reason"])] for w in ("opus", "astra")]})
        else:
            splits.append({"id": f"copy-{int(n):02d}", "number": int(n), "name": s["name"],
                           "options": [{"who": w, "score": last[w]["score"], "reason": english(last[w]["reason"]), "diffs": diffs(n, last[w]["choice"]),
                                        "problems": s["problems"].get(last[w]["choice"], [])} for w in ("opus", "astra")]})
    return {"rounds": state["rounds"], "changes": changes, "splits": splits, "kept": kept}


def build_page():
    assets_file = os.path.join(out, "assets.json")
    assets = json.load(open(assets_file)) if os.path.exists(assets_file) else {}
    items = shorts()
    for i in items:
        i["videoUrl"] = assets.get(i["video"])
        i["posterUrl"] = assets.get(i["poster"])
        del i["src"], i["posterAt"]
    lesson = dict(board["new"]["lesson"])
    lesson["videoUrl"] = assets.get("lesson-wangbi.mp4")
    lesson["posterUrl"] = assets.get("lesson-wangbi.jpg")
    del lesson["video"]
    data = {
        "built": subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=root, capture_output=True, text=True).stdout.strip(),
        "lesson": lesson,
        "endcards": board["new"]["endcards"],
        "endcardsNote": board["new"]["endcardsNote"],
        "critiques": board["critiques"],
        "decisions": board["decisions"],
        "copy": copy_review(),
        "shorts": items,
    }
    template = open(rel("scripts/review-board.html")).read()
    # </ inside the JSON would end the script element early.
    page = template.replace("/*BOARD_DATA*/null", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
    open(os.path.join(out, "index.html"), "w").write(page)
    missing = [k for k in [i["video"] for i in items] + ["lesson-wangbi.mp4"] if k not in assets]
    print(f"out/review/index.html ({len(page) / 1e3:.0f} kB); {len(missing)} videos not uploaded yet")


if __name__ == "__main__":
    {"media": build_media, "page": build_page}[sys.argv[1]]()
