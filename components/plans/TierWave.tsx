/**
 * The drifting wave in a tier card's background.
 *
 * Two layers move at different speeds so the motion reads as depth rather
 * than one sliding picture. Each layer holds two identical copies of a
 * tileable wave and travels exactly half its own width, so the animation
 * ends on the frame it began on and loops without a seam.
 *
 * The path tiles because its endpoints share a y value and its end tangent
 * matches its start tangent — a wave whose slopes disagreed at the join
 * would visibly kink once a cycle.
 */

/** One period, 1440 wide, centred on y=60. Start and end tangent both (180,-30). */
const PERIOD = "C180,30 360,90 720,60 C1080,30 1260,90 1440,60";

/** Two periods laid end to end, closed to the bottom edge for a fill. */
const WAVE = `M0,60 ${PERIOD} ${PERIOD.replace(
  /(\d+),(\d+)/g,
  (_, x: string, y: string) => `${Number(x) + 1440},${y}`,
)} L2880,140 L0,140 Z`;

export function TierWave({
  from,
  to,
  id,
}: {
  /** Crest colour, already carrying the tier's alpha. */
  from: string;
  /** Trough colour, normally the same hue at zero alpha. */
  to: string;
  id: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[220px] overflow-hidden [filter:blur(14px)]"
    >
      {/* Blurred so the two layers read as light moving under the surface
          rather than as drawn shapes; slow enough to notice only if you look. */}
      {/* Back layer: taller, slower, fainter. */}
      <svg
        className="qs-wave absolute bottom-0 left-0 h-[150px]"
        style={{ animationDuration: "23s", opacity: 0.6 }}
        viewBox="0 0 2880 140"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`${id}-back`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <path d={WAVE} fill={`url(#${id}-back)`} />
      </svg>

      {/* Front layer: shorter, quicker, and travelling the other way, so the
          two never lock into a single apparent direction. */}
      <svg
        className="qs-wave absolute bottom-0 left-0 h-[104px]"
        style={{ animationDuration: "16s", animationDirection: "reverse", opacity: 0.9 }}
        viewBox="0 0 2880 140"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`${id}-front`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <path d={WAVE} fill={`url(#${id}-front)`} />
      </svg>
    </div>
  );
}
