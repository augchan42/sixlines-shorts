"""Merges the depth review's parts (series/critic/depth/part-{a,b,c,d}.json) into review.json and
checks each proposal against the brief's rules:

- finding lines are at most 30 characters, and the finding starts with the right line label
- no banned word appears in a proposed lesson, finding or rewrite
- every Chinese phrase quoted in a `basis` appears in that hexagram's classic text in input.json

    python3 scripts/depth-review-merge.py   # writes series/critic/depth/review.json
"""

import json
import os
import re

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
d = os.path.join(root, "series/critic/depth")
inp = {e["number"]: e for e in json.load(open(os.path.join(d, "input.json")))["shorts"]}
BANNED = re.compile(r"oracle|divin|fortune|predict|mystic|magic", re.I)
HAN = re.compile(r"[一-鿿]{2,}")


def flatten(x):
    if isinstance(x, dict):
        return "".join(flatten(v) for v in x.values())
    if isinstance(x, list):
        return "".join(flatten(v) for v in x)
    return x or ""


def checks(r):
    out = []
    classic = re.sub(r"[，。；：、「」『』《》？！\s]", "", flatten(inp[r["number"]]["classic"]))
    f = r.get("finding")
    if f and f.get("line") is not None:
        label = {1: "AT THE BASE:", 6: "AT THE TOP:"}.get(f["line"], f"LINE {f['line']}:")
        if not f["text"].startswith(label):
            out.append(f"finding should start {label}")
    if f:
        out += [f"finding line over 30: {len(l)} '{l}'" for l in f["text"].split("\n") if len(l) > 30]
    texts = [(r.get("lesson") or {}).get("text"), (f or {}).get("text")] + [p.get("rewrite") for p in r.get("promises", [])]
    out += [f"banned word in '{t}'" for t in texts if t and BANNED.search(t)]
    for b in [(r.get("lesson") or {}).get("basis"), (f or {}).get("basis")]:
        for ph in HAN.findall(b or ""):
            if ph not in classic:
                out.append(f"basis phrase not in the classic text: {ph}")
    return out


rows = []
for p in "abcd":
    path = os.path.join(d, f"part-{p}.json")
    if os.path.exists(path):
        rows += json.load(open(path))["shorts"]
rows.sort(key=lambda r: r["number"])
for r in rows:
    r["current"] = {"hook": inp[r["number"]]["hook"], "lesson": inp[r["number"]]["lesson"]["text"], "finding": (inp[r["number"]].get("readout") or {}).get("finding")}
    r["checks"] = checks(r)
json.dump({"shorts": rows}, open(os.path.join(d, "review.json"), "w"), ensure_ascii=False, indent=1)
missing = sorted(set(inp) - {r["number"] for r in rows} - {10})
print(f"{len(rows)} reviewed; missing: {missing}; below 8: {sum(r['depth'] < 8 for r in rows)}")
for r in rows:
    flag = " !" + "; ".join(r["checks"]) if r["checks"] else ""
    new = (r.get("lesson") or {}).get("text", "").replace("\n", " ")
    print(f"{r['number']:>2} {r['depth']:>2}  {r['current']['lesson'].replace(chr(10), ' ')}" + (f"  ->  {new}" if new else "") + flag)
