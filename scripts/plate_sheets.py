"""Contact sheets of a hexagram's Yilin plates, for picking the two behind its meaning lines.
Two sheets per hexagram, out/plates/N-a.png (plates 1-32) and N-b.png (33-64), each plate
labelled with its key N-k. Plate N-N is left out: the verse screen already shows it.

  python3 scripts/plate_sheets.py 3 4 5 ...
  python3 scripts/plate_sheets.py --chosen 3 4 5 ...   # out/plates/chosen-3.png: each
      hexagram's two plates from series/copy.json, with the meaning line over each
"""

import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

SIZE = 256
COLS = 8
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = ImageFont.truetype("/System/Library/Fonts/Supplemental/Andale Mono.ttf", 28)


def sheet(n, ks, out):
    rows = (len(ks) + COLS - 1) // COLS
    im = Image.new("RGB", (COLS * SIZE, rows * SIZE), "gray")
    draw = ImageDraw.Draw(im)
    for i, k in enumerate(ks):
        plate = Image.open(os.path.join(ROOT, f"public/assets/yilin/stipple-{n}-{k}.webp")).convert("RGB")
        plate.thumbnail((SIZE - 4, SIZE - 4))
        x, y = (i % COLS) * SIZE + 2, (i // COLS) * SIZE + 2
        im.paste(plate, (x, y))
        label = f"{n}-{k}"
        box = draw.textbbox((x + 4, y + 4), label, font=FONT)
        draw.rectangle((box[0] - 4, box[1] - 4, box[2] + 4, box[3] + 4), fill="black")
        draw.text((x + 4, y + 4), label, font=FONT, fill="yellow")
    im.save(out)


def chosen(ns, out, per_row=4):
    copy = json.load(open(os.path.join(ROOT, "series/copy.json")))
    small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Andale Mono.ttf", 20)
    rows = (len(ns) + per_row - 1) // per_row
    im = Image.new("RGB", (per_row * 2 * SIZE, rows * SIZE), "gray")
    draw = ImageDraw.Draw(im)
    for i, n in enumerate(ns):
        e = copy[str(n)]
        for j, key in enumerate(e["plates"]):
            plate = Image.open(os.path.join(ROOT, f"public/assets/yilin/stipple-{key}.webp")).convert("RGB")
            plate.thumbnail((SIZE - 4, SIZE - 4))
            x, y = ((i % per_row) * 2 + j) * SIZE + 2, (i // per_row) * SIZE + 2
            im.paste(plate, (x, y))
            text = f"{key}\n" + e["meaning"][j]["text"]
            box = draw.multiline_textbbox((x + 4, y + 4), text, font=small)
            draw.rectangle((box[0] - 4, box[1] - 4, box[2] + 4, box[3] + 4), fill="black")
            draw.multiline_text((x + 4, y + 4), text, font=small, fill="yellow")
    im.save(out)


def main():
    os.makedirs(os.path.join(ROOT, "out/plates"), exist_ok=True)
    if sys.argv[1] == "--chosen":
        ns = list(map(int, sys.argv[2:]))
        out = os.path.join(ROOT, f"out/plates/chosen-{ns[0]}.png")
        chosen(ns, out)
        print(out)
        return
    for n in map(int, sys.argv[1:]):
        for half, ks in (("a", range(1, 33)), ("b", range(33, 65))):
            sheet(n, [k for k in ks if k != n], os.path.join(ROOT, f"out/plates/{n}-{half}.png"))
        print(f"out/plates/{n}-a.png, {n}-b.png")


if __name__ == "__main__":
    main()
