"""Ranks 32-second windows of the tracks at 120 bpm or slower by how moody they may sound:
minor rather than major (music/mode.py's margin), dark rather than bright (a low spectral
centroid), and quiet rather than loud. The user found 47's pick22 section a "guitar medley
retro" and asked for something "more moody" for Oppression (2026-09-26); the ear decides,
this only picks what to listen to first. Writes music/moody.json.

  python3 music/moody.py [--top 12]
"""

import argparse
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from analyse import SR, load as decode  # noqa: E402
from mode import MUSIC, ROOT, brightness, chroma, key  # noqa: E402

WINDOW, STEP = 32.0, 8.0  # seconds: about a short's length, stepped by two bars at 120 bpm
MAX_BPM = 120


def windows(y):
    n = len(y) / SR
    t = 0.0
    while t + WINDOW <= n:
        yield t, y[int(t * SR) : int((t + WINDOW) * SR)]
        t += STEP


def score(margin, centroid, loud):
    """Higher is moodier: minor margin counts most, then darkness, then quiet."""
    return round(4 * margin - centroid / 4000 - loud, 3)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--top", type=int, default=12)
    args = p.parse_args()
    modes = {t["file"]: t for t in json.load(open(os.path.join(ROOT, "music/mode.json")))["tracks"]}
    rows = []
    for name, t in sorted(modes.items()):
        if t["bpm"] > MAX_BPM:
            continue
        y = decode(os.path.join(MUSIC, name))
        whole = float(np.sqrt(np.mean(y**2)))
        for start, w in windows(y):
            k, margin = key(chroma(w))
            loud = float(np.sqrt(np.mean(w**2))) / max(whole, 1e-9)
            c = brightness(w)
            rows.append({"file": name, "bpm": t["bpm"], "start": start, "key": k, "minorMargin": margin, "centroid": c, "loudness": round(loud, 2), "score": score(margin, c, loud)})
        print(name, file=sys.stderr)
    rows.sort(key=lambda r: -r["score"])
    # The best window of each track first, so one track can't fill the list.
    best, seen = [], set()
    for r in rows:
        if r["file"] not in seen:
            best.append(r)
            seen.add(r["file"])
    json.dump({"script": "music/moody.py", "window": WINDOW, "best": best, "top": rows[: args.top * 4]}, open(os.path.join(ROOT, "music/moody.json"), "w"), indent=1)
    for r in best[: args.top]:
        print(f'{r["score"]:6.3f}  {r["file"][:44]:44}  {r["start"]:6.1f}s  {r["key"]:9} {r["bpm"]:6.1f} bpm  centroid {r["centroid"]}')


if __name__ == "__main__":
    main()
