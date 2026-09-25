// A character's settings in series/characters.json as blender/character.py's options:
// camelCase keys become --kebab-case, lists are joined with commas, and true is a bare switch.
export function characterFlags(args) {
  return Object.entries(args).flatMap(([k, v]) => {
    const flag = `--${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
    if (v === true) return [flag];
    if (v === false) return [];
    return [flag, Array.isArray(v) ? v.join(",") : String(v)];
  });
}
