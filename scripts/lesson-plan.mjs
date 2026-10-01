// Prints a lesson's page timings (lessonPlan in src/templates/Lesson.tsx) for a props file, so a
// Blender scene can be timed to the pages: [{page, from, frames, aAt}] in frames at 30 fps, and the
// end. The Lesson code is bundled with esbuild into out/plan/ (gitignored) and run in node.
//
//   node scripts/lesson-plan.mjs series/explainers/structure-timeline.props.json
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");

export const lessonPlan = async (props) => {
  const out = path.join(root, "out/plan/lesson.mjs");
  await build({
    entryPoints: [path.join(root, "src/templates/Lesson.tsx")],
    outfile: out,
    bundle: true,
    format: "esm",
    platform: "node",
    jsx: "automatic",
    packages: "external",
    loader: { ".png": "empty", ".jpg": "empty", ".ttf": "empty", ".woff2": "empty", ".css": "empty" },
    logLevel: "error",
    // Fonts load over fetch in the browser; node needs only the timings.
    plugins: [{ name: "no-fonts", setup: (b) => b.onResolve({ filter: /^@remotion\/fonts$/ }, () => ({ path: "fonts", namespace: "stub" })) || b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({ contents: "export const loadFont = () => Promise.resolve();" })) }],
  });
  const { lessonPlan: plan } = await import(`${pathToFileURL(out).href}?${Date.now()}`);
  const { pages, end } = plan(props);
  return { pages: pages.map((t) => ({ chapter: !!t.page.chapter, from: t.from, frames: t.frames, aAt: t.aAt })), end };
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await lessonPlan(JSON.parse(readFileSync(process.argv[2], "utf8"))), null, 1));
}
