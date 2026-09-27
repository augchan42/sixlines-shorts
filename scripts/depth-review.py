"""Gathers what the depth review needs: every short's on-screen copy (hook, meaning cards, question,
lesson, readout finding) and the classic text of its hexagram from chinese-classics-reference's
Zhouyi zhushu: the judgment, the Tuan, the Great Image, and each line's statement, Small Image
(小象) and Wang Bi's note (注).

The review applies what 10 (Treading) taught on 2026-09-27. Its lesson went from "Beside the
strong, be courteous." to "Near a temper, stay quiet." and then "Near a temper, stay steady
inside." The user: "there's got to be more than that than just staying quiet". Line 2's Small
Image, 中不自亂 (steady within, not thrown into disorder), gave the reason behind the image. Its
meaning card "Act well and it won't flare" promised an outcome and became "Stay steady and it may
pass." The user then asked: "let's do a review of the others based on our learnings from 10".

    python3 scripts/depth-review.py   # writes series/critic/depth/input.json
"""

import json
import os
import re
import subprocess

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ref = os.path.expanduser("~/projects/chinese-classics-reference")
text_dir = os.path.join(ref, "zhouyi-zhushu/text")
HEADS = {1: ("初",), 2: ("六二", "九二"), 3: ("六三", "九三"), 4: ("六四", "九四"), 5: ("六五", "九五"), 6: ("上",)}
copy = json.load(open(os.path.join(root, "series/copy.json")))
audit = {r["number"]: r for r in json.load(open(os.path.join(root, "series/critic/readouts/line-audit.json")))["readouts"]}


def blocks(n):
    f = next(x for x in sorted(os.listdir(text_dir)) if x.startswith(f"{n:02d}-"))
    body = open(os.path.join(text_dir, f)).read()
    parts = re.split(r"^## ", body, flags=re.M)
    out = {b.split("\n", 1)[0].strip(): b for b in parts[1:]}
    out[""] = parts[0]
    return out


def paras(block):
    # Paragraphs with their tag (經, 注, 疏) or "" when the source left it off (29 line 5).
    out = []
    for p in block.split("\n"):
        m = re.match(r"【(.)】(.*)", p.strip())
        if m:
            out.append((m.group(1), m.group(2).strip()))
        elif p.strip() and p.strip() != "---":
            out.append(("", p.strip()))
    return out


def tagged(block, tag):
    return [t for g, t in paras(block) if g == tag]


def is_image(t):
    return t.startswith(("《象》", "象曰"))


def line(bs, k):
    # Some lines carry their statement under 【疏】 (10 line 3) or no tag (29 line 5), and Qian and
    # Kun keep theirs apart (a 小象傳 section, or 小象傳（初六） after each line), so the statement is the first
    # paragraph that opens with the line's own heading.
    head, block = next((h, b) for h, b in bs.items() if h.startswith(HEADS[k]) and not (k != 1 and h.startswith("初")))
    ps = paras(block.split("\n", 1)[1])
    statement = next((t for g, t in ps if g != "注" and t.startswith(head)), None)
    image = next((t for g, t in ps if g != "注" and is_image(t)), None)
    if image is None and f"小象傳（{head}）" in bs:
        image = next((t for g, t in paras(bs[f"小象傳（{head}）"]) if is_image(t)), None)
    # Some notes lost their 【注】 tag (13 lines 1-3) or sit under 【經】 as 注云 (24 line 5, 33 line 1), so an untagged paragraph that is neither the
    # statement nor the Small Image is taken as the note.
    note = [t for g, t in ps if g == "注"] or [t[3:] for g, t in ps if t.startswith("注云：")] or [t for g, t in ps if g == "" and t != statement and not is_image(t)]
    return {"statement": statement, "smallImage": image, "wangBi": note[0] if note else None}


def classic(n):
    bs = blocks(n)
    # The first 經 paragraph names the trigrams (履兌下乾上, ䷇比卦坤下坎上); Qian and Kun put the judgment on the
    # same line (乾下乾上。乾：元，亨，利，貞。), so only the trigram names are dropped. 52 keeps its
    # judgment in pieces above the Tuan and commentary under 卦辭, so the section that holds the
    # trigram names is the one read, and quoted commentary (「…」者) is left out.
    trigrams = re.compile(r"^\S{1,6}?下\S上。?")
    section = next((bs[k] for k in ("卦辭", "") if any(trigrams.match(p) for p in tagged(bs.get(k, ""), "經"))), "")
    judgment = [trigrams.sub("", p) for p in tagged(section, "經") if not p.startswith("「")]
    judgment = ["".join(p for p in judgment if p)]
    tuan = [p for p in tagged(bs.get("彖傳", ""), "經")]
    image = [p for p in tagged(bs.get("大象傳", ""), "經")]
    out = {"judgment": judgment, "tuan": tuan, "greatImage": image}
    if "小象傳" in bs:
        out["smallImages"] = tagged(bs["小象傳"], "經")
    out["lines"] = {str(k): line(bs, k) for k in range(1, 7)}
    return out


entries = []
for key in sorted(copy, key=int):
    n, c = int(key), copy[key]
    lesson = c["lesson"]
    ro = lesson.get("readout")
    e = {
        "number": n,
        "hook": c["hook"]["text"],
        "meaning": [m["text"] for m in c["meaning"]],
        "question": c["question"]["text"],
        "lesson": {"kind": lesson.get("kind"), "text": lesson["text"], "source": lesson.get("source")},
        "classic": classic(n),
    }
    if ro:
        e["readout"] = {"finding": ro.get("finding"), "mark": [m + 1 for m in ro["mark"]], "master": ro.get("master"), "timed": ro.get("timed", False)}
        if n in audit:
            a = audit[n]
            e["lineAudit"] = {k: a.get(k) for k in ("verdict", "fit", "lines", "finding", "lessonOption", "why") if k in a}
    entries.append(e)

ref_commit = subprocess.run(["git", "-C", ref, "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
out = {"checkedAgainst": f"chinese-classics-reference@{ref_commit}:zhouyi-zhushu/text", "shorts": entries}
path = os.path.join(root, "series/critic/depth/input.json")
os.makedirs(os.path.dirname(path), exist_ok=True)
json.dump(out, open(path, "w"), ensure_ascii=False, indent=1)
missing = [(e["number"], k) for e in entries for k, v in e["classic"]["lines"].items() if not v["statement"] or not (v["smallImage"] or e["classic"].get("smallImages"))]
print(f"{len(entries)} shorts -> {os.path.relpath(path, root)}; lines missing a statement or Small Image: {missing}")
