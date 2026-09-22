/**
 * A band of light travelling across whatever it is placed in.
 *
 * Two bands, the second half a cycle ahead via a negative delay, so one is
 * always crossing and the surface is never idle. The parent needs `relative`
 * and `overflow-hidden`; the bands sit behind content on their own layer.
 *
 * Decoration only — it carries no state and means nothing, so reduced motion
 * removes it entirely rather than leaving a stripe parked mid-surface.
 */
export function Sweep({
  color,
  seconds = 7,
  offset = 0,
  className = "",
}: {
  /** The band's colour at full strength, alpha included. */
  color: string;
  /** One crossing, end to end. */
  seconds?: number;
  /** Shifts this surface's pair against its neighbours'. */
  offset?: number;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {[0, seconds / 2].map((phase) => (
        <span
          key={phase}
          className="qs-sweep"
          style={{
            animationDuration: `${seconds}s`,
            animationDelay: `${-(phase + offset)}s`,
            background: `linear-gradient(100deg, transparent, ${color}, transparent)`,
          }}
        />
      ))}
    </span>
  );
}
