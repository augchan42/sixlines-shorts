import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fringe, RGBSplit, Slices } from "../fx/Glitch";
import { fonts } from "../lib/fonts";
import { framesPerBeat, jitter, useGrid } from "../lib/timing";
import type { ShortProps } from "../schema";

type Rival = ShortProps["rivals"][number];

// Each rival app gets four beats: pop in, get stamped on beat 2, glitch out.
export const Rivals: React.FC<{ rivals: Rival[]; verdict: string; beatsEach: number }> = ({
  rivals,
  verdict,
  beatsEach,
}) => {
  const grid = useGrid();
  const each = framesPerBeat(grid) * beatsEach;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {rivals.map((rival, i) => (
        <Sequence key={rival.label} from={Math.round(i * each)} durationInFrames={Math.round(each)}>
          <RivalCard rival={rival} verdict={verdict} seed={`rival-${i}`} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const RivalCard: React.FC<{ rival: Rival; verdict: string; seed: string }> = ({ rival, verdict, seed }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const beat = framesPerBeat(useGrid());
  const stampAt = Math.round(beat * 2);
  const stamped = frame >= stampAt;

  const pop = spring({ frame, fps, config: { damping: 11, stiffness: 180 } });
  const stamp = spring({ frame: frame - stampAt, fps, config: { damping: 9, stiffness: 260 } });
  const outro = frame > durationInFrames - 6;
  const shake = stamped && frame - stampAt < 8 ? 18 : 0;

  return (
    <Slices amount={outro ? 160 : stamped && frame - stampAt < 4 ? 90 : 0} seed={seed}>
      <RGBSplit amount={stamped ? 10 + (outro ? 20 : 0) : 0} seed={seed}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            transform: `translate(${jitter(`${seed}-sx`, frame, 1) * shake}px, ${jitter(`${seed}-sy`, frame, 1) * shake}px)`,
          }}
        >
          <div
            style={{
              width: 440,
              height: 440,
              borderRadius: 100,
              background: `linear-gradient(135deg, ${rival.from}, ${rival.to})`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${pop})`,
              filter: stamped ? "grayscale(0.85) brightness(0.55)" : "none",
              boxShadow: `0 0 80px ${rival.from}66`,
            }}
          >
            <div style={{ fontSize: 300, lineHeight: 1, color: "#fff", fontWeight: 700 }}>{rival.glyph}</div>
          </div>
          <div
            style={{
              marginTop: 48,
              fontFamily: fonts.pixel,
              fontSize: 54,
              color: "#fff",
              opacity: interpolate(frame, [4, 8], [0, 0.85], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            {rival.label}
          </div>
          {stamped && (
            <div
              style={{
                position: "absolute",
                fontFamily: fonts.punch,
                fontSize: 210,
                color: "#ff1f3d",
                letterSpacing: 6,
                transform: `rotate(-9deg) scale(${interpolate(stamp, [0, 1], [2.4, 1])})`,
                textShadow: `${fringe(6)}, 0 0 40px rgba(255,20,40,0.8)`,
                WebkitTextStroke: "3px #300",
              }}
            >
              {verdict}
            </div>
          )}
        </AbsoluteFill>
      </RGBSplit>
    </Slices>
  );
};
