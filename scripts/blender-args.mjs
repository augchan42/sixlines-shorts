// Arguments for scripts/blender.mjs, kept apart so they can be tested without running Blender.

export const parseBlenderArgs = (argv) => {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i === -1 ? undefined : argv[i + 1];
  };
  const lines = get("--lines");
  if (!lines || !/^[01]{6}$/.test(lines)) {
    throw new Error(`--lines must be six 0s and 1s, bottom line first, 1 = yang (got ${lines ?? "nothing"})`);
  }
  const bpm = Number(get("--bpm"));
  if (!(bpm > 0)) throw new Error(`--bpm must be a positive number (got ${get("--bpm") ?? "nothing"})`);
  const beats = Number(get("--beats") ?? 4);
  // The lines land by beat 2.5 and the camera pushes in from beat 3.
  if (!(beats >= 3)) throw new Error(`--beats must be 3 or more (got ${get("--beats")})`);
  const edge = get("--edge") ?? "#6cff7a";
  if (!/^#[0-9a-fA-F]{6}$/.test(edge)) throw new Error(`--edge must be a colour like #6cff7a (got ${edge})`);
  return { lines: [...lines].map(Number), bpm, beats, edge, preview: argv.includes("--preview") };
};
