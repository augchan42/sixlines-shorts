"""For scripts/endcards-ref: prints a short's lines and end card mode ("101001 join"), and marks
its row in series/copy.json with endcardRef so it plays the tempo-independent card.

    python3 scripts/endcard-ref-row.py 22
"""

import json
import os
import sys

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
n = int(sys.argv[1])
row = next(r for r in json.load(open(os.path.join(root, "series/hexagrams.json"))) if r["number"] == n)
# ENDCARD_MODE in src/series/props.ts.
MODE = {"kun": "join", "gen": "join", "qian": "flip", "li": "flip", "zhen": "snap", "kan": "snap", "xun": "snap", "dui": "snap"}
print("".join(map(str, row["lines"])), MODE[row["upper"]])

path = os.path.join(root, "series/copy.json")
copy = json.load(open(path))
if not copy[str(n)].get("endcardRef"):
    copy[str(n)]["endcardRef"] = True
    # The file's own shape: one-space indent, a newline at the end (round-trips byte for byte).
    with open(path, "w") as f:
        json.dump(copy, f, ensure_ascii=False, indent=1)
        f.write("\n")
