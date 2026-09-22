import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
}) {
  return (
    <Tag
      className={`rounded-lg border border-[var(--line)] bg-ink-850 p-[22px] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardHead({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <header className={`mb-[18px] flex items-center justify-between gap-3.5 ${className}`}>{children}</header>;
}

export function CardLabel({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-500">
      {children}
    </p>
  );
}
