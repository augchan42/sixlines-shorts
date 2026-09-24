"""Cuts a 35 s listening preview of each track into out/music-previews/ (gitignored), plus
one file of all of them in a row with 1 s of silence between, and prints where each starts.
A track with a section in sections.json is cut from that section's start; any other from 12 s
before its biggest energy rise, the part a short would use.

  python3 music/preview.py pick12 pick13 ...    # file-name prefixes in music/analysis.json

The rise is the energy of a bar and the next above the four bars before, as in drops.py,
but without its usability rules, since a track the user likes by ear may not pass them.
"""

import json
import os
import subprocess
import sys

BEFORE = 12.0
LENGTH = 35.0


def biggest_rise(energy):
    best = (-99.0, 4)
    for i in range(4, len(energy) - 1):
        rise = (energy[i] + energy[i + 1]) / 2 - sum(energy[i - 4 : i]) / 4
        if rise > best[0]:
            best = (rise, i)
    return best


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.dirname(here)
    analysis = json.load(open(os.path.join(here, "analysis.json")))
    sections = {s["file"]: s for s in json.load(open(os.path.join(here, "sections.json")))["sections"]}
    out = os.path.join(root, "out", "music-previews")
    os.makedirs(out, exist_ok=True)
    parts = []
    t = 0.0
    for prefix in sys.argv[1:]:
        track = next(x for x in analysis["tracks"] if x["file"].startswith(prefix))
        rise, bar = biggest_rise(track["energy"])
        drop = track["firstBeat"] + bar * track["barSeconds"]
        start = max(0.0, min(drop - BEFORE, track["duration"] - LENGTH))
        if track["file"] in sections:
            s = sections[track["file"]]
            start, drop = s["start"], s["start"] + s["drop"]
        name = os.path.join(out, f"{prefix}.mp3")
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.2f}", "-t", str(LENGTH), "-i", os.path.join(root, "public/local/music", track["file"]),
             "-af", "afade=t=in:d=0.5,afade=t=out:st=33.5:d=1.5", "-ar", "44100", "-ac", "2", "-b:a", "160k", name],
            check=True,
        )
        parts.append(name)
        print(f"{t:6.1f} s  {prefix}: {track['title']}, {track['bpm']} bpm, from {start:.1f} s, drop at {drop:.1f} s")
        t += LENGTH + 1
    silence = os.path.join(out, "silence.mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", "1", "-b:a", "160k", silence], check=True)
    listing = os.path.join(out, "list.txt")
    with open(listing, "w") as f:
        for p in parts:
            f.write(f"file '{p}'\nfile '{silence}'\n")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", listing, "-c", "copy", os.path.join(out, "all.mp3")], check=True)


if __name__ == "__main__":
    main()
