"""Cuts a listening file for each hexagram in music/review.json: a spoken label, the
music its short uses now, then "proposed" and the darker section in its place, each for the
file's `seconds`. Also joins them all into one file and prints where each starts. Writes to
out/music-review/ (gitignored); the user keeps or swaps each by ear.

  python3 music/review.py [music/review-64.json]
"""

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MUSIC = os.path.join(ROOT, "public/local/music")
WORDS = ["one", "two", "three", "four", "five"]
AUDIO = ["-ar", "44100", "-ac", "2", "-b:a", "160k"]


def run(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def spoken(text, name):
    aiff = name + ".aiff"
    subprocess.run(["say", "-o", aiff, text], check=True)
    run("-i", aiff, "-af", "apad=pad_dur=0.4", *AUDIO, name)
    os.remove(aiff)
    return name


def music(file, start, seconds, name):
    run("-ss", f"{start:.2f}", "-t", str(seconds), "-i", os.path.join(MUSIC, file),
        "-af", f"afade=t=in:d=0.3,afade=t=out:st={seconds - 1.5}:d=1.5,apad=pad_dur=0.8", *AUDIO, name)
    return name


def join(parts, name):
    listing = name + ".txt"
    with open(listing, "w") as f:
        f.writelines(f"file '{p}'\n" for p in parts)
    run("-f", "concat", "-safe", "0", "-i", listing, *AUDIO, name)
    os.remove(listing)


def length(name):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", name],
                                capture_output=True, text=True, check=True).stdout)


def main():
    path = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(HERE, "review.json")
    review = json.load(open(path))
    OUT = os.path.join(ROOT, "out", os.path.splitext(os.path.basename(path))[0].replace("review", "music-review"))
    rows = {r["number"]: r for r in json.load(open(os.path.join(ROOT, "series/hexagrams.json")))}
    seconds = review["seconds"]
    tmp = os.path.join(OUT, "parts")
    os.makedirs(tmp, exist_ok=True)
    files, t = [], 0.0
    for h in review["hexagrams"]:
        n, row = h["number"], rows[h["number"]]
        options = h["proposed"] if isinstance(h["proposed"], list) else [h["proposed"]]
        stem = os.path.join(tmp, f"{n:02d}")
        parts = [
            spoken(f"{n}. {row['name']}. Now.", stem + "-a.mp3"),
            music(row["music"]["file"], row["music"]["start"], seconds, stem + "-now.mp3"),
        ]
        for k, p in enumerate(options):
            label = "Proposed." if len(options) == 1 else f"Option {WORDS[k]}."
            parts += [spoken(label, f"{stem}-b{k}.mp3"), music(p["file"], p["start"], seconds, f"{stem}-new{k}.mp3")]
        name = os.path.join(OUT, f"{n:02d}-{row['name'].lower().replace(' ', '-')}.mp3")
        join(parts, name)
        files.append(name)
        m, s = divmod(t, 60)
        said = ", ".join(f"{p['file'][:6]} at {p['start']} s" for p in options)
        print(f"{int(m)}:{s:04.1f}  {n} {row['name']} ({h['why']}): now {row['music']['file'][:6]} at {row['music']['start']:.0f} s, proposed {said}")
        t += length(name)
    join(files, os.path.join(OUT, "all.mp3"))
    print(os.path.join(OUT, "all.mp3"))


if __name__ == "__main__":
    main()
