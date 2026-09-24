"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * The sheet a record opens into: a transaction, a deposit, a withdrawal.
 *
 * One component because there were three copies and they had already drifted —
 * two had the mobile fix that stops a long reference running off the side of a
 * phone, the third did not. Anything done here now reaches all three.
 *
 * On a phone it rises from the bottom edge; from 601px up it is centred. The
 * height is in `dvh`, not `vh`, so the browser's own chrome sliding in and out
 * does not crop the last row.
 */
export function DetailSheet({
  label,
  title,
  meta,
  onClose,
  children,
}: {
  /** What a screen reader announces the dialog as. */
  label: string;
  title: string;
  meta?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    /* The page behind a sheet must not scroll with it. Without this, a phone
       scrolls the dashboard underneath while the customer reads the record,
       and closing the sheet leaves them somewhere they never navigated to. */
    const body = document.body;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prev = { overflow: body.style.overflow, padding: body.style.paddingRight };
    body.style.overflow = "hidden";
    /* Desktop only: compensate the scrollbar so the layout does not jump. */
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    /* Focus moves in, and goes back where it came from on close, so keyboard
       and screen-reader users are not dropped at the top of the page. */
    const returnTo = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKey);
      body.style.overflow = prev.overflow;
      body.style.paddingRight = prev.padding;
      returnTo?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
      className="fixed inset-0 z-[60] grid place-items-end bg-[rgba(4,7,15,0.72)] backdrop-blur-[3px] min-[601px]:place-items-center min-[601px]:p-5"
    >
      <div
        ref={panel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="grid max-h-[88dvh] w-full max-w-[460px] gap-4 overflow-y-auto overscroll-contain rounded-t-xl border border-[var(--line)] bg-ink-850 p-5 outline-none [padding-bottom:calc(1.25rem+env(safe-area-inset-bottom))] min-[601px]:rounded-xl min-[601px]:[padding-bottom:1.25rem]"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[1.0625rem] font-semibold tracking-[-0.02em]">{title}</p>
            {meta && <p className="mt-0.5 text-xs text-mist-500">{meta}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 flex-none place-items-center rounded-sm text-mist-500 transition-colors hover:bg-ink-700 hover:text-mist-50 max-[720px]:size-11"
          >
            <Icon name="close" size={16} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

/** One labelled fact. `break-all` is what keeps a reference on the screen. */
export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 bg-ink-800 px-[13px] py-3">
      <dt className="flex-none text-xs text-mist-500">{label}</dt>
      <dd className="min-w-0 break-all text-right text-[0.8125rem] font-medium tabular-nums text-mist-200">
        {children}
      </dd>
    </div>
  );
}

/** The bordered list the rows sit in. */
export function DetailRows({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
      {children}
    </dl>
  );
}
