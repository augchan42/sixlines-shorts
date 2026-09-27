import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import { fonts } from "../lib/fonts";

// The Blender end card (blender/endcard.py): the hexagram turns into six yang lines under
// SIX LINES, with the tagline and site. The credit whips in after it. Also plays lesson clips;
// `drop` moves the clip down (px) to clear room above it for text; `rate` below 1 plays it slower.
//
// With `text`, the clip was rendered without its tagline and site (--no-text) and they are
// drawn here on the same timing (the JSON Blender writes beside the clip): the tagline typed
// one character a frame from `rise + beat` with a block cursor that blinks on the half beat,
// the site brightening in over half a second after it. So a change of copy or font is a
// Remotion render, not 63 Blender ones (the user, 2026-09-27: "we really need a better way to
// compose or recompose all 64 without being such a huge render effort").
export type EndCardText = { rise: number; beat: number; frames: number; tagline: string; site: string };
export const EndCard3D: React.FC<{ clip: string; drop?: number; rate?: number; text?: EndCardText }> = ({ clip, drop = 0, rate = 1, text }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <OffthreadVideo src={staticFile(clip)} muted playbackRate={rate} style={{ width: "100%", height: "100%", transform: `translateY(${drop}px)` }} />
    {text && <Text {...text} rate={rate} />}
  </AbsoluteFill>
);

// Goudy Old Style, the app's reading face; local (public/local/fonts, not in git), loaded on
// first use so the other compositions never need it.
const GOUDY = "Goudy Old Style";
let goudy: Promise<void> | undefined;
const CREAM = "#f4efe4";
const EDGE = "#6cff7a";

const Text: React.FC<EndCardText & { rate: number }> = ({ rise, beat, tagline, site, rate }) => {
  goudy ??= loadFont({ family: GOUDY, url: staticFile("local/fonts/goudos.ttf") });
  const f = useCurrentFrame() * rate; // the clip's own frame
  const at = rise + Math.round(beat);
  const typed = Math.max(0, Math.min(tagline.length, Math.floor(f - at) + 1));
  const done = at + tagline.length - 1;
  const half = Math.round(beat / 2);
  // The cursor: on from half a beat before the first letter, then blinking on the half beat.
  const cursorOn = f >= at - half && (f < done ? true : Math.floor((f - done) / half) % 2 === 0);
  const siteAt = done + Math.round(0.5 * beat);
  const siteGlow = interpolate(f, [siteAt, siteAt + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      {/* The tagline's cap height sits at y 1249-1288 in the Blender card; the site at 1354-1405. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1234, textAlign: "center", fontFamily: `"${GOUDY}", serif`, fontSize: 58, lineHeight: "70px", color: CREAM, textShadow: `0 0 6px rgba(244,239,228,0.55), 0 0 22px rgba(244,239,228,0.25)`, whiteSpace: "pre" }}>
        {f >= at - half && (
          <span>
            {tagline.slice(0, typed)}
            <span style={{ display: "inline-block", width: 22, height: 44, marginLeft: typed ? 5 : 0, verticalAlign: "-6px", background: CREAM, opacity: cursorOn ? 1 : 0, boxShadow: cursorOn ? `0 0 8px rgba(244,239,228,0.6)` : undefined }} />
          </span>
        )}
      </div>
      {siteGlow > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1346, textAlign: "center", fontFamily: fonts.pixel, fontSize: 70, lineHeight: "70px", color: EDGE, opacity: 0.35 + 0.65 * siteGlow, textShadow: `0 0 ${6 * siteGlow}px rgba(108,255,122,0.9), 0 0 ${20 * siteGlow}px rgba(108,255,122,0.6), 0 0 ${48 * siteGlow}px rgba(108,255,122,0.35)` }}>
          {site}
        </div>
      )}
    </>
  );
};
