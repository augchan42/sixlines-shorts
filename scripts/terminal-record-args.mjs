// The ffmpeg argument list for scripts/terminal-record.mjs, kept apart so it can be
// tested without running Godot or ffmpeg.
//
// Godot's --write-movie AVI is MJPEG, which is full-range (color_range=pc). Converting
// it to yuv420p without rescaling the range leaves the output flagged full-range
// (yuvj420p) even though the pixel format says yuv420p — that broke an Instagram DM
// upload before. The scale filter rescales full range down to limited (tv) range so
// the mp4 is properly limited-range yuv420p.
export const ffmpegArgs = (avi, mp4) => [
  "-v",
  "error",
  "-y",
  "-i",
  avi,
  "-c:v",
  "libx264",
  "-vf",
  "scale=in_range=full:out_range=tv,format=yuv420p",
  "-pix_fmt",
  "yuv420p",
  "-crf",
  "18",
  "-c:a",
  "aac",
  "-movflags",
  "+faststart",
  mp4,
];
