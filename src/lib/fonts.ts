import { loadFont } from "@remotion/fonts";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBungee } from "@remotion/google-fonts/Bungee";
import { loadFont as loadGaramond } from "@remotion/google-fonts/EBGaramond";
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
  // Hexagram names. CJK falls through to the system serif.
  serif: `${loadGaramond("normal", { weights: ["500"], ...latin }).fontFamily}, "Songti SC", "Noto Serif CJK SC", serif`,
};
