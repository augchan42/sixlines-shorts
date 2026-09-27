// The flight camera over a lesson (src/templates/Lesson.tsx) is one state carried from page to
// page. It comes in once per hexagram: a page showing a different hexagram from the last one
// starts from far off, so its own `approach` brings the view in again (the Wang Bi lesson cuts
// from 22 to 7 for its last chapter).
export const cameraStart = <T>(carried: T, far: T, lastHex: number | undefined, hex: number): T =>
  lastHex !== undefined && lastHex !== hex ? far : carried;
