import { loadFont } from "@remotion/fonts";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBungee } from "@remotion/google-fonts/Bungee";
import { loadFont as loadGaramond } from "@remotion/google-fonts/EBGaramond";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadNotoSC } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadNotoTC } from "@remotion/google-fonts/NotoSansTC";
import { loadFont as loadSpecialElite } from "@remotion/google-fonts/SpecialElite";
import { staticFile } from "remotion";

const latin = { subsets: ["latin" as const] };

// Pixel Operator (CC0, Jayvee Enaguas), the font of the app and of her terminal captions.
const PIXEL = "Pixel Operator";
loadFont({ family: PIXEL, url: staticFile("fonts/PixelOperator-Bold.ttf"), weight: "700" });

export const fonts = {
  // Terminal captions ("THE BOOK OF CHANGES").
  pixel: `"${PIXEL}", monospace`,
  // Typewriter hook ("Best app?").
  typewriter: loadSpecialElite("normal", { weights: ["400"], ...latin }).fontFamily,
  // Condensed punch text ("BUT THIS…", "MOGGED").
  punch: loadAnton("normal", { weights: ["400"], ...latin }).fontFamily,
  // Creator credit.
  credit: loadBungee("normal", { weights: ["400"], ...latin }).fontFamily,
  // Her signature, "~DISNEYFAN": heavy, wide capitals.
  signature: loadMontserrat("normal", { weights: ["900"], ...latin }).fontFamily,
  // Hexagram names. CJK falls through to the system serif.
  serif: `${loadGaramond("normal", { weights: ["500"], ...latin }).fontFamily}, "Songti SC", "Noto Serif CJK SC", serif`,
};

// Chinese captions: the punch font for Latin letters and digits, Noto Sans Black for the
// characters. Loaded on first use, so only the Chinese videos fetch its many subset files.
export type Lang = "en" | "zh-Hans" | "zh-Hant";
const punchCJK: Partial<Record<Lang, string>> = {};
export const punchFor = (lang: Lang = "en") => {
  if (lang === "en") return fonts.punch;
  punchCJK[lang] ??= `${fonts.punch}, "${(lang === "zh-Hans" ? loadNotoSC : loadNotoTC)("normal", { weights: ["900"], ignoreTooManyRequestsWarning: true }).fontFamily}"`;
  return punchCJK[lang];
};
