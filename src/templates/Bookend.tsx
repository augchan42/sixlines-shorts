import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";

// A finished short between two Six Lines cards, Goudy on ivory as on sixlines.day: the short's
// hook set in Goudy, then a CRT flicker into the green terminal; at the end the green card
// flickers back out to the ivory one. The user, 2026-09-30: "starting with the classic Goudy on
// ivory appearance and then it eventually flickering into the more retro computing green on black
// ... on the outro, it would flicker out of the matrix style back into the six lines Goudy."
// The short plays as rendered (music and all); only the cards and the flicker sound are added.

export type BookendProps = {
  src: string; // the short, under public/
  frames: number; // its length
  hook: string;
  label: string; // "2 · 坤 KŪN · THE RECEPTIVE"
  tagline: string;
  site: string;
  inAt: number; // frame the flicker into the short starts
  outAt: number; // frame the flicker back to ivory starts
  tail: number; // frames the ivory card holds past the short
  sfx?: { in?: string; out?: string; inVolume?: number; outVolume?: number };
};

// sixlines-site's --background and --ink.
const IVORY = "#FAF9F5";
const INK = "#1c1a17";
const GOUDY = "Goudy Old Style";
let goudy: Promise<void> | undefined;
const serif = `"${GOUDY}", serif`;

// Frames of each flicker, from its start: true shows the ivory card. Two flashes, 3 frames each,
// under three a second (no strobe), ending on the side it goes to.
const IN = [true, false, false, false, true, true, true];
const OUT = [false, true, true, true, false, false, false];

// Six yang bars where the green card's are (measured on Kun's frame 898): x 231-847, 51 high,
// tops 666, 746, 825 and 964, 1044, 1123.
const BAR_TOPS = [666, 746, 825, 964, 1044, 1123];
const Bars: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    {BAR_TOPS.map((y) => <rect key={y} x={231} y={y} width={617} height={51} fill={INK} />)}
  </svg>
);

const Open: React.FC<Pick<BookendProps, "hook" | "label">> = ({ hook, label }) => (
  <AbsoluteFill style={{ background: IVORY, color: INK, fontFamily: serif }}>
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", fontSize: 40, letterSpacing: 6 }}>{label}</div>
    <div style={{ position: "absolute", top: 700, left: 110, right: 110, textAlign: "center", fontSize: 108, lineHeight: 1.12 }}>{hook}</div>
  </AbsoluteFill>
);

// Matched to the green card: SIX caps at y 367-461, LINES 524-617; tagline caps 1249-1288
// (EndCard3D's top 1234, 58 px); site 1354-1405.
const Close: React.FC<Pick<BookendProps, "tagline" | "site">> = ({ tagline, site }) => (
  <AbsoluteFill style={{ background: IVORY, color: INK, fontFamily: serif }}>
    <div style={{ position: "absolute", top: TITLE_TOP, left: 0, right: 0, textAlign: "center", fontSize: TITLE_SIZE, lineHeight: "157px", letterSpacing: TITLE_SPACING, whiteSpace: "pre" }}>
      {"SIX\nLINES"}
    </div>
    <Bars />
    <div style={{ position: "absolute", top: 1234, left: 0, right: 0, textAlign: "center", fontSize: 58, lineHeight: "70px" }}>{tagline}</div>
    <div style={{ position: "absolute", top: SITE_TOP, left: 0, right: 0, textAlign: "center", fontSize: SITE_SIZE, lineHeight: 1 }}>{site}</div>
  </AbsoluteFill>
);
const TITLE_TOP = 337;
const TITLE_SIZE = 136;
const TITLE_SPACING = -3;
const SITE_TOP = 1346;
const SITE_SIZE = 60;

export const bookendFrames = (p: BookendProps) => p.frames + p.tail;

export const Bookend: React.FC<BookendProps> = (p) => {
  goudy ??= loadFont({ family: GOUDY, url: staticFile("local/fonts/goudos.ttf") });
  const f = useCurrentFrame();
  const open = f < p.inAt || (f < p.inAt + IN.length && IN[f - p.inAt]);
  const close = f >= p.outAt + OUT.length || (f >= p.outAt && OUT[f - p.outAt]);
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <OffthreadVideo src={staticFile(p.src)} endAt={p.frames} />
      {open && <Open hook={p.hook} label={p.label} />}
      {close && <Close tagline={p.tagline} site={p.site} />}
      {p.sfx?.in && (
        <Sequence from={p.inAt} layout="none">
          <Audio src={staticFile(p.sfx.in)} volume={p.sfx.inVolume ?? 0.6} />
        </Sequence>
      )}
      {p.sfx?.out && (
        <Sequence from={p.outAt} layout="none">
          <Audio src={staticFile(p.sfx.out)} volume={p.sfx.outVolume ?? 0.6} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
