"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { declareTransfer, type DepositActionState } from "@/app/deposit-actions";
import { createClient } from "@/lib/supabase/client";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { money, ngnToUsd, usd } from "@/lib/format";

const INITIAL: DepositActionState = { error: null };

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];

/**
 * "I've sent it."
 *
 * Nothing announces a payment here — there is no provider webhook and no chain
 * watcher — so the customer says what they sent and somebody checks the
 * account or the explorer. Pressing this files a claim, nothing more: the row
 * is written pending, no balance moves, and the copy says so rather than
 * implying the money is on its way in.
 *
 * The receipt is optional but asked for, because it is the difference between
 * the back office matching a transfer in a minute and hunting for it.
 */
export function DeclareTransfer({
  destinationId,
  asset,
  minimum,
  rate = 0,
  userId,
}: {
  destinationId: string;
  /** null for naira; a ticker means the chain needs a transaction hash. */
  asset: string | null;
  /** The method's own floor, the same one the database enforces. */
  minimum: number;
  /** Naira per dollar; zero states the floor in naira alone. */
  rate?: number;
  /** Whose folder the receipt goes into. From the server, not the browser. */
  userId: string;
}) {
  const [state, action, pending] = useActionState(declareTransfer, INITIAL);
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileProblem, setFileProblem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  /**
   * The receipt goes straight from here to storage, then only its path is
   * sent to the action. A Server Action body is capped at 1MB by default and
   * a phone screenshot is several times that, so posting the file through
   * the action meant the request never arrived and this form sat on
   * "Recording…" indefinitely.
   *
   * The bucket's policy only lets somebody write into the folder named after
   * their own id, so the path is not a matter of trust.
   */
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.delete("proof");

    if (file) {
      setUploading(true);
      const suffix = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${suffix}`;
      const { error } = await createClient()
        .storage.from("deposit-proofs")
        .upload(path, file, { contentType: file.type, upsert: false });
      setUploading(false);

      if (error) {
        setFileProblem("That receipt could not be uploaded. Try again, or file without it.");
        return;
      }
      data.set("proof_path", path);
    }

    startTransition(() => action(data));
  }

  const typed = Number(amount.replace(/[₦,\s]/g, ""));
  const valid = Number.isFinite(typed) && typed > 0;
  const belowMinimum = valid && minimum > 0 && typed < minimum;
  const busy = pending || uploading;
  const ready = valid && !belowMinimum && !busy;

  function take(chosen: File | null) {
    if (!chosen) {
      setFile(null);
      setFileProblem(null);
      return;
    }
    if (!TYPES.includes(chosen.type)) {
      setFileProblem("Attach a PNG, JPG, WEBP or PDF.");
      return;
    }
    if (chosen.size > MAX_BYTES) {
      setFileProblem("That file is over 5MB. Attach a smaller one.");
      return;
    }
    setFileProblem(null);
    setFile(chosen);
  }

  /* Filed. The claim, its reference and what happens next — not a balance. */
  if (state.success) {
    return (
      <div className="grid justify-items-start gap-3 border-t border-[var(--line-soft)] pt-4">
        <span className="grid size-11 place-items-center rounded-lg border border-[rgba(233,184,114,0.28)] bg-[var(--warn-soft)] text-warn">
          <Icon name="clock" size={21} />
        </span>
        <p className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-mist-50">
          Deposit request logged
        </p>
        <p className="max-w-[52ch] text-[0.8125rem] leading-[1.65] text-mist-400">
          We are verifying your transfer
          {state.amount ? ` of ${money(state.amount, { decimals: 2 })}` : ""}. Your
          balance updates once it is confirmed as received — nothing on this
          screen credits your account.
        </p>

        {state.reference && (
          <div className="w-full rounded-md border border-[var(--line)] bg-ink-800 px-3.5 py-3">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-500">
              Reference
            </p>
            <p className="mt-1 font-mono text-[0.9375rem] text-mist-50">{state.reference}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/transactions" variant="primary" size="sm">
            View transactions
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="ghost" size="sm">
            Return to dashboard
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 border-t border-[var(--line-soft)] pt-4">
      <input type="hidden" name="destination_id" value={destinationId} />

      <div className="grid gap-[7px]">
        <label htmlFor="declare-amount" className="text-[0.8125rem] font-medium text-mist-200">
          Already sent it? Tell us the amount
        </label>
        <div className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-ink-800 px-3.5 focus-within:border-[var(--accent-line)]">
          <span className="flex-none text-[0.9375rem] text-mist-500">{asset ?? "₦"}</span>
          <input
            id="declare-amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-[46px] min-w-0 flex-1 bg-transparent text-[0.9375rem] tabular-nums outline-none placeholder:text-mist-500"
          />
        </div>
        {belowMinimum ? (
          <p className="text-xs leading-[1.6] text-warn">
            The smallest deposit is{" "}
            {asset
              ? `${minimum} ${asset}`
              : rate > 0
                ? `${usd(ngnToUsd(minimum, rate))} (${money(minimum, { decimals: 2 })})`
                : money(minimum, { decimals: 2 })}
            .
          </p>
        ) : (
          <p className="text-xs leading-[1.6] text-mist-500">
            {asset
              ? "Send only to the address above, and only on the network shown."
              : "Attach the receipt below so your transfer can be matched to you."}
          </p>
        )}
      </div>

      {asset && (
        <div className="grid gap-[7px]">
          <label htmlFor="declare-hash" className="text-[0.8125rem] font-medium text-mist-200">
            Transaction hash
          </label>
          <input
            id="declare-hash"
            name="tx_hash"
            autoComplete="off"
            spellCheck={false}
            placeholder="0x…"
            className="h-[46px] rounded-md border border-[var(--line)] bg-ink-800 px-3.5 font-mono text-[0.8125rem] outline-none focus:border-[var(--accent-line)] placeholder:text-mist-500"
          />
          <p className="text-xs leading-[1.6] text-mist-500">
            From your wallet or the explorer. It is how your payment is found
            among everything else sent to that address.
          </p>
        </div>
      )}

      {/* --- Receipt ---------------------------------------------------- */}
      <div className="grid gap-[7px]">
        <label htmlFor="declare-proof" className="text-[0.8125rem] font-medium text-mist-200">
          Upload payment receipt or screenshot{" "}
          <span className="font-normal text-mist-500">(recommended)</span>
        </label>

        <input
          ref={inputRef}
          id="declare-proof"
          name="proof"
          type="file"
          accept={TYPES.join(",")}
          onChange={(e) => take(e.target.files?.[0] ?? null)}
          className="sr-only"
        />

        {file ? (
          <div className="flex items-center gap-3 rounded-md border border-[var(--line)] bg-ink-800 px-3.5 py-3">
            <span className="grid size-9 flex-none place-items-center rounded-sm bg-[var(--accent-soft)] text-accent-300">
              <Icon name="file" size={17} />
            </span>
            <span className="grid min-w-0 flex-1 gap-[2px]">
              <span className="truncate text-[0.8125rem] font-medium">{file.name}</span>
              <span className="text-xs text-mist-500">
                {(file.size / 1024).toFixed(0)} KB
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                take(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="flex-none text-xs font-medium text-mist-400 transition-colors hover:text-down"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = e.dataTransfer.files?.[0] ?? null;
              if (dropped && inputRef.current) {
                const bag = new DataTransfer();
                bag.items.add(dropped);
                inputRef.current.files = bag.files;
              }
              take(dropped);
            }}
            className="grid justify-items-center gap-1.5 rounded-md border border-dashed border-[var(--line-strong)] bg-ink-800 px-4 py-5 text-center transition-colors hover:border-[var(--accent-line)]"
          >
            <Icon name="download" size={18} className="rotate-180 text-mist-400" />
            <span className="text-[0.8125rem] font-medium text-mist-200">
              Drag a file here, or click to attach
            </span>
            <span className="text-xs text-mist-500">PNG, JPG, WEBP or PDF · up to 5MB</span>
          </button>
        )}

        {fileProblem && <p className="text-xs text-down">{fileProblem}</p>}
        <p className="text-xs leading-[1.6] text-mist-500">
          It is how your transfer gets matched quickly. You can file without one.
        </p>
      </div>

      {state.error && (
        <p className="flex items-start gap-2 rounded-md border border-[rgba(240,104,123,0.24)] bg-[var(--down-soft)] px-3.5 py-2.5 text-[0.8125rem] leading-[1.55] text-down">
          <Icon name="alert" size={15} className="mt-0.5 flex-none" />
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={!ready}
        className="justify-self-start"
      >
        {uploading ? "Uploading receipt…" : pending ? "Recording…" : "I've sent it"}
      </Button>

      <p className="text-xs leading-[1.6] text-mist-500">
        This records that you say you sent it. Your balance changes only once
        the payment is confirmed as received.
      </p>
    </form>
  );
}
