import Link from "next/link";

/**
 * The QuickStark mark: an original geometric monogram — an open ring
 * resolving into an ascending stroke.
 *
 * Rendered inline so it stays sharp at any size, carries no background plate
 * or container, and keeps its proportions. If an official logo file is
 * supplied, replace the <svg> here and every call site picks it up.
 */

const SIZES = { sm: 22, md: 26, lg: 32 } as const;
const TEXT = { sm: "text-[0.9375rem]", md: "text-[1.0625rem]", lg: "text-xl" } as const;

export function Mark({ size = 26, id = "qs" }: { size?: number; id?: string }) {
  const gradientId = `${id}-mark-gradient`;
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" aria-hidden="true" className="flex-none">
      <defs>
        <linearGradient id={gradientId} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6ee789" />
          <stop offset="0.55" stopColor="#10b936" />
          <stop offset="1" stopColor="#2f56c4" />
        </linearGradient>
      </defs>
      <path
        d="M23.66 17.55A9.8 9.8 0 1 0 17.55 23.66"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <path d="M19.4 19.4 27.2 27.2" stroke={`url(#${gradientId})`} strokeWidth="3.2" strokeLinecap="round" />
      <path
        d="M11.2 17.6 14.6 14.2l2.6 2.6 4-4"
        stroke="#cddcff"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />
    </svg>
  );
}

export function Logo({
  size = "md",
  href = "/",
  id = "qs",
}: {
  size?: keyof typeof SIZES;
  href?: string | null;
  id?: string;
}) {
  const inner = (
    <>
      <Mark size={SIZES[size]} id={id} />
      <span>QuickStark</span>
    </>
  );

  /* The link is a touch target on a phone; the wordmark itself stays its own
   size, the extra height is only hit area. */
  const className = `inline-flex items-center gap-2.5 font-semibold tracking-[-0.025em] text-mist-50 transition-opacity hover:opacity-80 max-[720px]:min-h-[44px] ${TEXT[size]}`;

  if (href === null) return <span className={className}>{inner}</span>;

  return (
    <Link href={href} className={className} aria-label="QuickStark home">
      {inner}
    </Link>
  );
}
