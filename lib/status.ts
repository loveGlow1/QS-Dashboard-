import type { TransactionStatus } from "@/lib/types";

/**
 * How a ledger status is shown. One definition, because the last time this
 * lived in three files a new status reached two of them and the third kept
 * painting it red.
 *
 * `cancelled` is deliberately neutral rather than down-tinted: the customer
 * withdrew the request themselves, nothing failed, and the money is back in
 * their spendable balance.
 */
export const TXN_STATUS: Record<
  TransactionStatus,
  { label: string; dot: string; text: string }
> = {
  completed: { label: "Completed", dot: "bg-up", text: "text-up" },
  pending: { label: "Pending", dot: "bg-warn", text: "text-warn" },
  failed: { label: "Failed", dot: "bg-down", text: "text-down" },
  cancelled: { label: "Cancelled", dot: "bg-mist-500", text: "text-mist-400" },
};

/** Falls back to the raw value, so an unmapped status is still legible. */
export function txnStatus(status: string) {
  return (
    TXN_STATUS[status as TransactionStatus] ?? {
      label: status,
      dot: "bg-mist-500",
      text: "text-mist-400",
    }
  );
}
