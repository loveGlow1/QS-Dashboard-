import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "ghost" | "quiet" | "plain";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] whitespace-nowrap transition-[background-color,border-color,color,transform,opacity] duration-150 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent-500 text-white border border-accent-500 shadow-[0_8px_24px_-12px_rgba(77,124,243,0.9)] hover:bg-accent-400 hover:border-accent-400",
  ghost:
    "border border-[var(--line-strong)] text-mist-200 hover:bg-[rgba(148,168,214,0.07)] hover:text-mist-50",
  quiet: "text-mist-400 hover:text-mist-50 hover:bg-[rgba(148,168,214,0.07)]",
  /* Sets no colours at all. For callers supplying their own palette, where a
     variant's text colour would otherwise win on CSS source order regardless
     of class order in the attribute. */
  plain: "border",
};

const SIZES: Record<Size, string> = {
  sm: "h-[34px] px-3.5 text-[0.8125rem]",
  md: "h-[42px] px-[18px] text-sm",
  lg: "h-[50px] px-[26px] text-[0.9375rem]",
};

function classes(variant: Variant, size: Size, block?: boolean, extra?: string) {
  return [BASE, VARIANTS[variant], SIZES[size], block ? "w-full" : "", extra ?? ""]
    .filter(Boolean)
    .join(" ");
}

interface Shared {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = "ghost",
  size = "md",
  block,
  className,
  busy,
  children,
  ...rest
}: Shared & ComponentProps<"button"> & { busy?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || busy}
      aria-busy={busy || undefined}
      className={classes(variant, size, block, className)}
    >
      {busy ? <Spinner /> : children}
    </button>
  );
}

export function ButtonLink({
  variant = "ghost",
  size = "md",
  block,
  className,
  href,
  children,
  ...rest
}: Shared & ComponentProps<typeof Link>) {
  return (
    <Link {...rest} href={href} className={classes(variant, size, block, className)}>
      {children}
    </Link>
  );
}

function Spinner() {
  return (
    <span
      className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
      aria-hidden="true"
    />
  );
}
