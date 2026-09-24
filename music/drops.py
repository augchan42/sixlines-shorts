"""Lists every drop in the series' eight tracks that a short could be cut around, from the
energy per bar in analysis.json, to judge whether a track has more than one usable section.

  python3 music/drops.py > music/drops.json

A drop is a bar where the energy of it and the next bar is at least LIFT above the four
bars before. It is usable when the track has PRE bars before it (the hook and the hexagram
build) and POST bars from it on (meaning, screens, end card and credit) that stay at least
HOLD, so the short does not run into a breakdown or the track's ending.
"""

import json
import os
import subprocess
import sys

LIFT = 2.0
PRE = 6
POST = 12
HOLD = 5


def drops(energy):
    found = []
    for i in range(4, len(energy) - 1):
        before = sum(energy[i - 4 : i]) / 4
        after = (energy[i] + energy[i + 1]) / 2
        if after - before < LIFT:
            continue
        if found and i - found[-1]["bar"] < 4:  # one build, not every bar of it
            continue
        tail = energy[i : i + POST]
        usable = i >= PRE and len(tail) == POST and min(tail) >= HOLD
        found.append({"bar": i, "lift": round(after - before, 2), "usable": usable})
    return found


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    analysis = json.load(open(os.path.join(here, "analysis.json")))
    tracks = {t["file"]: t for t in analysis["tracks"]}
    sections = json.load(open(os.path.join(here, "sections.json")))["sections"]
    commit = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True, cwd=here).stdout.strip()
    out = []
    for s in sections:
        t = tracks[s["file"]]
        bar = t["barSeconds"]
        chosen = round((s["start"] + s["drop"] - t["firstBeat"]) / bar)
        out.append(
            {
                "trigram": s["trigram"],
                "file": s["file"],
                "bpm": t["bpm"],
                "chosenBar": chosen,
                "drops": [dict(d, seconds=round(t["firstBeat"] + d["bar"] * bar, 2), chosen=d["bar"] == chosen) for d in drops(t["energy"])],
            }
        )
    json.dump(
        {"script": "music/drops.py", "commit": commit, "rule": {"lift": LIFT, "pre": PRE, "post": POST, "hold": HOLD}, "tracks": out},
        sys.stdout,
        indent=1,
    )
    print()


if __name__ == "__main__":
    main()
