import type { DepositStatus, TransactionStatus, WithdrawalStatus } from "@/lib/types";

type Tone = { label: string; dot: string; text: string };

/* `cancelled` is deliberately neutral rather than down-tinted: the customer
   withdrew it themselves, nothing failed, and the money is back in their
   spendable balance. */
const NEUTRAL: Tone = { label: "Cancelled", dot: "bg-mist-500", text: "text-mist-400" };
const HELD: Tone = { label: "Pending", dot: "bg-warn", text: "text-warn" };
const MOVING: Tone = { label: "Processing", dot: "bg-accent-500", text: "text-accent-300" };
const DONE: Tone = { label: "Completed", dot: "bg-up", text: "text-up" };

/**
 * How a status is shown, in one place for every list that shows one.
 *
 * These lived in four files. That is how a new status reaches three of them
 * and the fourth keeps painting it red.
 */
export const TXN_STATUS: Record<TransactionStatus, Tone> = {
  completed: DONE,
  pending: HELD,
  failed: { label: "Failed", dot: "bg-down", text: "text-down" },
  cancelled: NEUTRAL,
};

export const WITHDRAWAL_STATUS: Record<WithdrawalStatus, Tone> = {
  pending: HELD,
  processing: MOVING,
  completed: DONE,
  rejected: { label: "Rejected", dot: "bg-down", text: "text-down" },
  failed: { label: "Failed", dot: "bg-down", text: "text-down" },
  cancelled: NEUTRAL,
};

export const DEPOSIT_STATUS: Record<DepositStatus, Tone> = {
  pending: HELD,
  waiting_for_confirmations: { ...MOVING, label: "Confirming" },
  processing: MOVING,
  completed: DONE,
  failed: { label: "Failed", dot: "bg-down", text: "text-down" },
  cancelled: NEUTRAL,
};

/** Falls back to the raw value, so a status nobody mapped is still legible. */
function lookup<T extends string>(map: Record<T, Tone>, status: string): Tone {
  return map[status as T] ?? { ...NEUTRAL, label: status };
}

export const txnStatus = (s: string) => lookup(TXN_STATUS, s);
export const withdrawalStatus = (s: string) => lookup(WITHDRAWAL_STATUS, s);
export const depositStatus = (s: string) => lookup(DEPOSIT_STATUS, s);
