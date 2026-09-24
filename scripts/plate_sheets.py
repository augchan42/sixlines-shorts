"""Contact sheets of a hexagram's Yilin plates, for picking the two behind its meaning lines.
Two sheets per hexagram, out/plates/N-a.png (plates 1-32) and N-b.png (33-64), each plate
labelled with its key N-k. Plate N-N is left out: the verse screen already shows it.

  python3 scripts/plate_sheets.py 3 4 5 ...
"""

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


def main():
    os.makedirs(os.path.join(ROOT, "out/plates"), exist_ok=True)
    for n in map(int, sys.argv[1:]):
        for half, ks in (("a", range(1, 33)), ("b", range(33, 65))):
            sheet(n, [k for k in ks if k != n], os.path.join(ROOT, f"out/plates/{n}-{half}.png"))
        print(f"out/plates/{n}-a.png, {n}-b.png")


if __name__ == "__main__":
    main()
