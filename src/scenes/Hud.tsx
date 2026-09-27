import { fonts } from "../lib/fonts";
import { DIM, glow, PHOSPHOR } from "./Readout";

// The screen's furniture, after the Nostromo's navigation displays in Alien (DEORBITAL
// DESCENT, APPROACH PARK ORBIT): a large title with small boxed tags beside it, crosshairs
// in the corners of the drawing area, and a column of labelled values in boxes down the right
// edge. All green: the user, 2026-09-27, "frame stays green, no need for blue on every screen,
// only where it is needed to explain a point". A value that matters now is shown inverted,
// dark on a green fill, as on the IMAX projector panel the user sent.

export const BLUE = "#4f8dff";

// The drawing area inside the frame, and the column to its right.
export const FRAME = { left: 50, right: 1030, top: 150, bottom: 1720, head: 130 };
export const COLUMN = { left: 850, width: 150 };

export const Tag: React.FC<{ text: string; size?: number; on?: boolean }> = ({ text, size = 26, on }) => (
  <span
    style={{
      display: "inline-block",
      fontFamily: fonts.pixel,
      fontSize: size,
      lineHeight: 1.2,
      padding: "2px 10px",
      border: `2px solid ${on ? PHOSPHOR : DIM}`,
      color: on ? "#000" : PHOSPHOR,
      backgroundColor: on ? PHOSPHOR : "transparent",
      boxShadow: on ? `0 0 10px ${PHOSPHOR}` : "none",
      whiteSpace: "pre",
    }}
  >
    {text}
  </span>
);

const Cross: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <path d={`M${x - 34},${y}H${x + 34}M${x},${y - 34}V${y + 34}`} stroke={DIM} strokeWidth={2} fill="none" />
);

export type Field = { label: string; value: string; on?: boolean };

// `cross`: the corners of the drawing (the plot) to mark with crosshairs.
export const Hud: React.FC<{ title: string; tags: string[]; fields: Field[]; now: number; cross: { left: number; right: number; top: number; bottom: number } }> = ({ title, tags, fields, now, cross: inner }) => {
  const { left, right, top, bottom, head } = FRAME;
  return (
    <>
      <div style={{ position: "absolute", left, top, width: right - left, height: bottom - top, border: `3px solid ${DIM}`, boxShadow: "inset 0 0 40px rgba(125,255,138,0.08)" }} />
      <div style={{ position: "absolute", left, top, width: right - left, height: head, borderBottom: `3px solid ${DIM}` }} />
      <div style={{ position: "absolute", left: COLUMN.left - 20, top: top + head, height: bottom - top - head, borderLeft: `3px solid ${DIM}` }} />
      <div style={{ position: "absolute", left: left + 30, top: top + 14, fontFamily: fonts.pixel, fontSize: 64, lineHeight: 1.1, color: PHOSPHOR, textShadow: glow }}>{title}</div>
      <div style={{ position: "absolute", left: left + 30, top: top + 88, display: "flex", gap: 14 }}>
        {tags.map((t) => (
          <Tag key={t} text={t} size={22} />
        ))}
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Cross x={inner.left} y={inner.top} />
        <Cross x={inner.right} y={inner.top} />
        <Cross x={inner.left} y={inner.bottom} />
        <Cross x={inner.right} y={inner.bottom} />
      </svg>
      <div style={{ position: "absolute", left: COLUMN.left, top: top + head + 40, width: COLUMN.width, fontFamily: fonts.pixel }}>
        {fields.map((f) => (
          <div key={f.label} style={{ marginBottom: 34 }}>
            <div style={{ fontSize: 24, lineHeight: 1.2, color: PHOSPHOR, textShadow: glow, whiteSpace: "pre" }}>{f.label}</div>
            <Tag text={f.value} size={30} on={f.on} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: COLUMN.left, top: bottom - 110, width: COLUMN.width, fontFamily: fonts.pixel }}>
        <div style={{ fontSize: 24, lineHeight: 1.2, color: PHOSPHOR, textShadow: glow }}>SYSTEM</div>
        <Tag text={(76.75 + ((now * 7.31) % 23)).toFixed(2)} size={30} />
      </div>
    </>
  );
};
