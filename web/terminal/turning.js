// web/terminal/turning.js
// Turning the plot by hand: a drag (as main.gd) or, on this page only, held keys (WASD or the
// arrows). A/D and left/right turn it about the vertical; W/S and up/down tilt it. Either way
// the turn stays within 80° of where it started and the tilt within 25°, and on release it
// eases back square (main.js starts that tween).

const DEG = Math.PI / 180;
export const DRAG_TAP_THRESHOLD = 12; // design px; a press that moves less is a tap
export const DRAG_TURN_PER_PX = 0.4 * DEG;
export const DRAG_TILT_PER_PX = 0.4 * DEG;
export const TURN_MAX = 80 * DEG;
export const TILT_MAX = 25 * DEG;
export const SETTLE_TIME = 1.2;
export const KEY_RATE = 60 * DEG; // radians a second while a key is held

export const TURN_KEYS = {
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
};

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// Angles for a drag `dx`, `dy` design px from where it started (turn0, tilt0 at the press).
export const dragAngles = (dx, dy, turn0, tilt0) => ({
  turn: clamp(turn0 + dx * DRAG_TURN_PER_PX, turn0 - TURN_MAX, turn0 + TURN_MAX),
  tilt: clamp(tilt0 + dy * DRAG_TILT_PER_PX, -TILT_MAX, TILT_MAX),
});

// Which way the held keys (a set of KeyboardEvent.code) point: [-1..1, -1..1]; opposite keys cancel.
export function heldDirection(held) {
  let x = 0;
  let y = 0;
  for (const code of held) {
    const d = TURN_KEYS[code];
    if (d) [x, y] = [x + d[0], y + d[1]];
  }
  return [Math.sign(x), Math.sign(y)];
}

// One step of `dt` seconds with `held` keys down; `base` is the turn when the keys were first held.
export function turnByKeys(held, dt, { turn, tilt, base }) {
  const [x, y] = heldDirection(held);
  return {
    turn: clamp(turn + x * KEY_RATE * dt, base - TURN_MAX, base + TURN_MAX),
    tilt: clamp(tilt + y * KEY_RATE * dt, -TILT_MAX, TILT_MAX),
  };
}
