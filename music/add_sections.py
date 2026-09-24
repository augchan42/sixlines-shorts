"""Adds a section of each named track to music/sections.json under a trigram, at the
biggest energy rise that leaves room for the rest of the short and that the short's plan
accepts (scripts/series/limits.mjs: at most 38 s, text and screens at least 2 s), starting
six bars before it (the hook and the hexagram build) or at the top of the track when the
rise is earlier.

  python3 music/add_sections.py pick13:kun pick17:kun ...   # file-name prefix:trigram

The rise is the same measure as preview.py. A new section has no licence certificate until
the user downloads it signed in; the render refuses it until then.
"""

import json
import os
import subprocess
import sys

PRE = 6
# The longest a short runs after its drop (seriesPlan's "after" mode), in beats, and a margin.
AFTER_BEATS = 44
MARGIN = 1.0


def at(track, i):
    bar = track["barSeconds"]
    if i >= PRE:
        return {"start": round(track["firstBeat"] + (i - PRE) * bar, 3), "firstBeat": 0.0, "drop": round(PRE * bar, 3)}
    return {"start": 0.0, "firstBeat": track["firstBeat"], "drop": round(track["firstBeat"] + i * bar, 3)}


def plan_problems(bpm, drops):
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = subprocess.run(
        ["node", "scripts/series/limits.mjs"], input=json.dumps([{"bpm": bpm, "drop": d} for d in drops]),
        capture_output=True, text=True, check=True, cwd=root,
    ).stdout
    return json.loads(out)


def section(track, problems=plan_problems):
    """The section at the biggest rise whose short fits; problems(bpm, drops) lists what is
    wrong with each drop's short."""
    bar = track["barSeconds"]
    energy = track["energy"]
    rises = []
    for i in range(4, len(energy) - 1):
        if track["firstBeat"] + i * bar + AFTER_BEATS * 60 / track["bpm"] + MARGIN > track["duration"]:
            break
        rises.append(((energy[i] + energy[i + 1]) / 2 - sum(energy[i - 4 : i]) / 4, i))
    rises.sort(key=lambda r: -r[0])
    candidates = [at(track, i) for _, i in rises]
    for c, p in zip(candidates, problems(track["bpm"], [c["drop"] for c in candidates])):
        if not p:
            return c
    raise ValueError("no rise in the track makes a short that fits")


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    tracks = json.load(open(os.path.join(here, "analysis.json")))["tracks"]
    path = os.path.join(here, "sections.json")
    doc = json.load(open(path))
    symbols = {s["trigram"]: s["symbol"] for s in doc["sections"]}
    for arg in sys.argv[1:]:
        prefix, trigram = arg.split(":")
        t = next(x for x in tracks if x["file"].startswith(prefix))
        if any(s["file"] == t["file"] for s in doc["sections"]):
            raise SystemExit(f"{t['file']} already has a section")
        s = section(t)
        doc["sections"].append(
            {"trigram": trigram, "symbol": symbols[trigram], "file": t["file"], "sha256": t["sha256"], "title": t["title"],
             "licence": t["licence"], "source": t["source"], "bpm": t["bpm"], **s}
        )
        print(f"{trigram:5} {t['file']}: from {s['start']} s, drop {s['drop']} s in")
    with open(path, "w") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write("\n")


if __name__ == "__main__":
    main()
