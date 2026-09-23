import { useEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

export type ImageMode =
  | { kind: "plain" }
  // Dots on black, dot size from brightness. Dots are `tint` (white by default), or with
  // `color` each dot takes the image's own hue at that cell.
  | { kind: "halftone"; cell: number; tint?: string; color?: boolean }
  // Nearest-neighbour blocks.
  | { kind: "pixel"; block: number };

type Props = {
  src: string;
  width: number;
  height: number;
  mode: ImageMode;
  // 1 = cover. Larger values zoom in around (panX, panY), each in [0, 1].
  zoom?: number;
  panX?: number;
  panY?: number;
};

const cache = new Map<string, Promise<HTMLImageElement>>();

const loadImage = (url: string) => {
  let p = cache.get(url);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load ${url}`));
      img.src = url;
    });
    cache.set(url, p);
  }
  return p;
};

// Source rectangle that covers a width×height frame, zoomed around a pan point.
const coverRect = (img: HTMLImageElement, width: number, height: number, zoom: number, panX: number, panY: number) => {
  const scale = Math.max(width / img.width, height / img.height) * zoom;
  const sw = width / scale;
  const sh = height / scale;
  const sx = (img.width - sw) * panX;
  const sy = (img.height - sh) * panY;
  return [sx, sy, sw, sh] as const;
};

export const ImageCanvas: React.FC<Props> = ({ src, width, height, mode, zoom = 1, panX = 0.5, panY = 0.5 }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [handle] = useState(() => delayRender(`Loading ${src}`));

  useEffect(() => {
    loadImage(staticFile(src))
      .then((loaded) => {
        setImg(loaded);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [src, handle]);

  useEffect(() => {
    const el = canvas.current;
    if (!el || !img) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const rect = coverRect(img, width, height, zoom, panX, panY);

    if (mode.kind === "plain") {
      ctx.drawImage(img, ...rect, 0, 0, width, height);
      return;
    }

    const size = mode.kind === "halftone" ? mode.cell : mode.block;
    const cols = Math.ceil(width / size);
    const rows = Math.ceil(height / size);
    const small = new OffscreenCanvas(cols, rows);
    const sctx = small.getContext("2d", { willReadFrequently: true });
    if (!sctx) return;
    sctx.drawImage(img, ...rect, 0, 0, cols, rows);

    if (mode.kind === "pixel") {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, 0, 0, cols, rows, 0, 0, cols * size, rows * size);
      return;
    }

    const data = sctx.getImageData(0, 0, cols, rows).data;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = mode.tint ?? "#fff";
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        // Contrast curve so midtones drop out, like a photocopied halftone.
        const r = Math.pow(lum, 1.6) * size * 0.72;
        if (r < 0.6) continue;
        if (mode.color) {
          // Full-strength hue; the dot's size already carries the brightness.
          const k = 255 / Math.max(1, data[i], data[i + 1], data[i + 2]);
          ctx.fillStyle = `rgb(${data[i] * k}, ${data[i + 1] * k}, ${data[i + 2] * k})`;
        }
        ctx.beginPath();
        ctx.arc(x * size + size / 2, y * size + size / 2, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [img, width, height, mode, zoom, panX, panY]);

  return <canvas ref={canvas} width={width} height={height} style={{ display: "block", width, height }} />;
};
