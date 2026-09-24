"""Adds a section of each named track to music/sections.json under a trigram, at the
biggest energy rise that leaves room for the rest of the short and that the short's plan
accepts (scripts/series/limits.mjs: at most 38 s, text and screens at least 2 s), starting
six bars before it (the hook and the hexagram build), or five or four when six make the
short too long, or at the top of the track when the rise is earlier.

  python3 music/add_sections.py pick13:kun pick17:kun ...   # file-name prefix:trigram

A track that already has a section gets another part of it, starting at least SPREAD
seconds from its other parts, so one song can serve a trigram more than once.

The rise is the same measure as preview.py. A new section has no licence certificate until
the user downloads it signed in; the render refuses it until then.
"""

import json
import os
import subprocess
import sys

# Bars before the rise, longest first.
LEAD_INS = (6, 5, 4)
# The longest a short runs after its drop (seriesPlan's "after" mode), in beats, and a margin.
AFTER_BEATS = 44
MARGIN = 1.0
# How far apart two parts of one song start: half a 35 s preview.
SPREAD = 17.5


def at(track, i, pre):
    bar = track["barSeconds"]
    if i >= pre:
        return {"start": round(track["firstBeat"] + (i - pre) * bar, 3), "firstBeat": 0.0, "drop": round(pre * bar, 3)}
    return {"start": 0.0, "firstBeat": track["firstBeat"], "drop": round(track["firstBeat"] + i * bar, 3)}


def plan_problems(bpm, drops):
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = subprocess.run(
        ["node", "scripts/series/limits.mjs"], input=json.dumps([{"bpm": bpm, "drop": d} for d in drops]),
        capture_output=True, text=True, check=True, cwd=root,
    ).stdout
    return json.loads(out)


def candidates(track, problems=plan_problems):
    """A section for every rise whose short fits, with the longest lead-in that fits,
    biggest rise first, each with its rise."""
    bar = track["barSeconds"]
    energy = track["energy"]
    rises = []
    for i in range(4, len(energy) - 1):
        if track["firstBeat"] + i * bar + AFTER_BEATS * 60 / track["bpm"] + MARGIN > track["duration"]:
            break
        rises.append(((energy[i] + energy[i + 1]) / 2 - sum(energy[i - 4 : i]) / 4, i))
    rises.sort(key=lambda r: -r[0])
    tries = [[dict(at(track, i, pre), rise=round(r, 2)) for pre in LEAD_INS] for r, i in rises]
    flat = [o for t in tries for o in t]
    ok = [not p for p in problems(track["bpm"], [o["drop"] for o in flat])]
    fits = iter(ok)
    options = []
    for t in tries:
        good = [o for o in t if next(fits)]
        if good:
            options.append(good[0])
    return options


def section(track, problems=plan_problems, taken=()):
    """The section at the biggest rise whose short fits and that starts SPREAD from every
    start in taken; problems(bpm, drops) lists what is wrong with each drop's short."""
    options = [o for o in candidates(track, problems) if all(abs(o["start"] - t) >= SPREAD for t in taken)]
    if not options:
        raise ValueError("no rise in the track makes a short that fits")
    return {k: v for k, v in options[0].items() if k != "rise"}


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    tracks = json.load(open(os.path.join(here, "analysis.json")))["tracks"]
    path = os.path.join(here, "sections.json")
    doc = json.load(open(path))
    symbols = {s["trigram"]: s["symbol"] for s in doc["sections"]}
    for arg in sys.argv[1:]:
        prefix, trigram = arg.split(":")
        t = next(x for x in tracks if x["file"].startswith(prefix))
        same = [s for s in doc["sections"] if s["file"] == t["file"]]
        if any(s["trigram"] != trigram for s in same):
            raise SystemExit(f"{t['file']} is under another trigram")
        s = section(t, taken=[x["start"] for x in same])
        if same:
            s["certificate"] = same[0]["certificate"]
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
