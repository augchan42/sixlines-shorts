"""Gathers what the readout line audit needs, one entry per readout short: the hook, question and
lesson sentence, the current finding and marked lines, and each of the six lines' classic
statement and Wang Bi's note, in Chinese and English.

The user, 2026-09-27, after 22 moved to one line (AT THE TOP: PLAIN WHITE.): "I like this style
much better. ... not every hexagram has strong lines like this. So we'll probably need to do an
audit to see which ones are best suited to this style."

    python3 scripts/readout-line-audit.py   # writes series/critic/readouts/line-audit-input.json

Line texts come from bookofchanges-site's Zhouyi zhushu (jing and zhu layers); its commit is
recorded in the output.
"""

import json
import os
import subprocess

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
site = os.path.expanduser("~/projects/bookofchanges-site")
zhushu = os.path.join(site, "src/data/zhouyi-zhushu/hexagrams")
rows = json.load(open(os.path.join(root, "series/hexagrams.json")))


def lines_of(n):
    f = next(x for x in sorted(os.listdir(zhushu)) if x.startswith(f"{n:02d}-"))
    sections = json.load(open(os.path.join(zhushu, f)))["sections"]
    out = {}
    for s in sections:
        if s["type"] == "line" and s["id"].startswith("line-"):
            k = int(s["id"].split("-")[1])
            if k > 6:
                continue
            jing, zhu = s["layers"].get("jing") or {}, s["layers"].get("zhu") or {}
            out[k] = {"zh": jing.get("zh"), "en": jing.get("en"), "wangBi": {"zh": zhu.get("zh"), "en": zhu.get("en")}}
        if s["type"] == "daxiang":
            out["image"] = s["layers"]["jing"]
    return out


entries = []
for r in rows:
    c = r["copy"]
    ro = c["lesson"].get("readout")
    if not ro:
        continue
    lines = lines_of(r["number"])
    entries.append({
        "number": r["number"],
        "name": r["name"],
        "zh": r["zh"],
        "lines": r["lines"],
        "hook": c["hook"]["text"],
        "meaning": [m["text"] for m in c["meaning"]],
        "question": c["question"]["text"],
        "lesson": c["lesson"]["text"],
        "finding": ro.get("finding"),
        "mark": [m + 1 for m in ro["mark"]],
        "master": ro.get("master"),
        "image": lines.pop("image", None),
        "lineTexts": {str(k): v for k, v in sorted(lines.items())},
    })

site_commit = subprocess.run(["git", "-C", site, "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
out = {"source": f"bookofchanges-site@{site_commit}:src/data/zhouyi-zhushu", "readouts": entries}
path = os.path.join(root, "series/critic/readouts/line-audit-input.json")
json.dump(out, open(path, "w"), ensure_ascii=False, indent=1)
print(f"{len(entries)} readouts -> {os.path.relpath(path, root)}")
