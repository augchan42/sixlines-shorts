"""Merges the three parts of the readout line audit (series/critic/readouts/line-audit-{a,b,c}.json)
and checks each chosen line against the classic statement in chinese-classics-reference's
Zhouyi zhushu text (the 【經】 line under each line's heading). The audit's input came from
bookofchanges-site, where some entries hold the Small Image (小象) or Wang Bi's note in place of
the statement; this second source is what the findings are checked against.

    python3 scripts/readout-line-audit-merge.py   # writes series/critic/readouts/line-audit.json
"""

import json
import os
import re
import subprocess

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ref = os.path.expanduser("~/projects/chinese-classics-reference")
text_dir = os.path.join(ref, "zhouyi-zhushu/text")
HEADS = {1: ("初",), 2: ("六二", "九二"), 3: ("六三", "九三"), 4: ("六四", "九四"), 5: ("六五", "九五"), 6: ("上",)}


def statement(n, line):
    f = next(x for x in sorted(os.listdir(text_dir)) if x.startswith(f"{n:02d}-"))
    body = open(os.path.join(text_dir, f)).read()
    for block in re.split(r"^## ", body, flags=re.M)[1:]:
        head = block.split("\n", 1)[0].strip()
        if not head.startswith(HEADS[line]) or head in ("初九", "初六") and line != 1:
            continue
        for m in re.finditer(r"【經】(.+)", block):
            s = m.group(1).strip()
            if not s.startswith("《象》"):
                return s
    return None


parts = [json.load(open(os.path.join(root, f"series/critic/readouts/line-audit-{p}.json"))) for p in "abc"]
rows = sorted((r for p in parts for r in p["readouts"]), key=lambda r: r["number"])
for r in rows:
    r["statements"] = {str(k): statement(r["number"], k) for k in r.get("lines", [])}
ref_commit = subprocess.run(["git", "-C", ref, "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
out = {"checkedAgainst": f"chinese-classics-reference@{ref_commit}:zhouyi-zhushu/text", "readouts": rows}
json.dump(out, open(os.path.join(root, "series/critic/readouts/line-audit.json"), "w"), ensure_ascii=False, indent=1)
for r in rows:
    st = " | ".join(f"L{k} {v}" for k, v in r["statements"].items())
    print(f'{r["number"]:>2} {r["verdict"]:<15} {r["fit"]:>2}  {r["finding"].replace(chr(10), " / ")}\n     {st}')
