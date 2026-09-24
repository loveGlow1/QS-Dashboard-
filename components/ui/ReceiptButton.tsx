"use client";

import { useState } from "react";
import { receiptLink } from "@/app/deposit-actions";
import { Icon } from "@/components/ui/Icon";

/**
 * Pulls the receipt attached to a deposit.
 *
 * The bucket is private. The link is signed when it is asked for and expires
 * in two minutes, rather than being handed out with the page and then living
 * in a browser history for good.
 */
export function ReceiptButton({ path }: { path: string }) {
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState(false);

  async function open() {
    setLoading(true);
    setError(false);
    const { url } = await receiptLink(path);
    setLoading(false);
    if (!url) {
      setError(true);
      return;
    }
    setOpened(true);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={open}
        disabled={loading}
        className="flex items-center gap-3 rounded-md border border-[var(--em-line)] bg-[var(--em-soft)] px-3.5 py-3 text-left transition-colors hover:border-[var(--em-line-strong)] disabled:opacity-60"
      >
        <span className="grid size-9 flex-none place-items-center rounded-sm bg-[rgba(96,250,131,0.12)] text-em-300">
          <Icon name="file" size={17} />
        </span>
        <span className="grid min-w-0 flex-1 gap-[2px]">
          <span className="text-[0.8125rem] font-medium text-mist-50">
            {loading ? "Opening receipt…" : opened ? "Open receipt again" : "View payment receipt"}
          </span>
          <span className="text-xs leading-[1.5] text-mist-500">
            Opens in a new tab. The link expires after two minutes.
          </span>
        </span>
        <Icon name="arrowUpRight" size={16} className="flex-none text-mist-400" />
      </button>

      {error && (
        <p className="text-xs leading-[1.6] text-down">
          That receipt could not be opened. Try again in a moment.
        </p>
      )}
    </div>
  );
}
