import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBungee } from "@remotion/google-fonts/Bungee";
import { loadFont as loadGaramond } from "@remotion/google-fonts/EBGaramond";
import { loadFont as loadSilkscreen } from "@remotion/google-fonts/Silkscreen";
import { loadFont as loadSpecialElite } from "@remotion/google-fonts/SpecialElite";

const latin = { subsets: ["latin" as const] };

export const fonts = {
  // Terminal captions ("THE BOOK OF CHANGES").
  pixel: loadSilkscreen("normal", { weights: ["700"], ...latin }).fontFamily,
  // Typewriter hook ("Best app?").
  typewriter: loadSpecialElite("normal", { weights: ["400"], ...latin }).fontFamily,
  // Condensed punch text ("BUT THIS…", "MOGGED").
  punch: loadAnton("normal", { weights: ["400"], ...latin }).fontFamily,
  // Creator credit.
  credit: loadBungee("normal", { weights: ["400"], ...latin }).fontFamily,
  // Hexagram names. CJK falls through to the system serif.
  serif: `${loadGaramond("normal", { weights: ["500"], ...latin }).fontFamily}, "Songti SC", "Noto Serif CJK SC", serif`,
};
