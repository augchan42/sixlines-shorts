import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { fringe, RGBSplit, Slices } from "../fx/Glitch";
import { ImageCanvas, type ImageMode } from "../fx/ImageCanvas";
import { fonts } from "../lib/fonts";
import { framesPerBeat, useGrid } from "../lib/timing";

const captionColors = ["#7dff8a", "#ffb23f", "#7dff8a"];

// The icon holds centre while colour-halftone art cycles behind it every two beats, or on
// `swaps` (frames from the scene start) when given, and terminal captions change every
// four beats. A `bare` swap shows its plate alone, in full colour, until the next swap.
// The last two beats punch into the icon.
export const Showcase: React.FC<{
  icon: string;
  art: string[];
  captions: string[];
  swaps?: number[];
  bare?: number[];
}> = ({ icon, art, captions, swaps, bare = [] }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const beat = framesPerBeat(useGrid());
  const beatIndex = Math.floor(frame / beat);
  const sinceBeat = frame - beatIndex * beat;

  const punchStart = durationInFrames - beat * 2;
  const punching = frame >= punchStart;

  const swapAt = swaps ?? Array.from({ length: Math.ceil(durationInFrames / (beat * 2)) }, (_, i) => Math.floor(i * 2 * beat));
  const swapIndex = Math.max(0, swapAt.filter((s) => frame >= s).length - 1);
  const bgIndex = swapIndex % art.length;
  const sinceSwap = frame - swapAt[swapIndex];
  const hidden = bare.includes(swapAt[swapIndex]);
  // A few frames of chunky pixels at each swap, the plate in full colour, then halftone.
  const mode: ImageMode =
    sinceSwap < 3
      ? { kind: "pixel", block: 72 - sinceSwap * 20 }
      : sinceSwap < 8 || hidden
        ? { kind: "plain" }
        : { kind: "halftone", cell: 13, color: true };

  const caption = captions[Math.min(Math.floor(beatIndex / 4), captions.length - 1)];
  const captionAge = frame - Math.floor(beatIndex / 4) * 4 * beat;
  const typed = Math.ceil(interpolate(captionAge, [0, 8], [0, caption.length], { extrapolateRight: "clamp" }));
  const color = captionColors[Math.floor(beatIndex / 4) % captionColors.length];

  const pulse = interpolate(sinceBeat, [0, 5], [1.06, 1], { extrapolateRight: "clamp" });
  const punch = interpolate(frame, [punchStart, durationInFrames], [1, 3.2], { extrapolateLeft: "clamp" });

  return (
    <Slices amount={sinceSwap < 3 || frame > durationInFrames - 4 ? 140 : 0} seed={`show-${bgIndex}`}>
      <RGBSplit amount={punching ? interpolate(frame, [punchStart, durationInFrames], [4, 30]) : sinceSwap < 4 ? 12 : 3} seed="show">
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
          <AbsoluteFill style={{ opacity: punching ? 0.35 : 0.9 }}>
            <ImageCanvas
              src={art[bgIndex]}
              width={width}
              height={height}
              mode={mode}
              zoom={1.1 + (sinceSwap / (beat * 2)) * 0.12}
            />
          </AbsoluteFill>
          {!punching && !hidden && (
            <AbsoluteFill style={{ padding: "210px 90px 0" }}>
              <div style={{ fontFamily: fonts.pixel, fontSize: 150, lineHeight: 1.15, color, textShadow: fringe(3) }}>
                {caption.slice(0, typed)}
              </div>
              <div style={{ width: 200, height: 12, marginTop: 28, backgroundColor: color, boxShadow: `0 0 18px ${color}` }} />
            </AbsoluteFill>
          )}
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: hidden ? 0 : 1 }}>
            <Img
              src={staticFile(icon)}
              style={{
                width: 560,
                marginTop: punching ? 0 : 220,
                transform: `scale(${punching ? punch : pulse})`,
                filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.6))",
              }}
            />
          </AbsoluteFill>
        </AbsoluteFill>
      </RGBSplit>
    </Slices>
  );
};
