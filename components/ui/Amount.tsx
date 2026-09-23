import { money, ngnToUsd, usd } from "@/lib/format";

/**
 * A figure in dollars, with the naira it actually is underneath.
 *
 * The ledger is naira — that is the amount that moves, the amount a bank
 * transfer carries, the amount a withdrawal pays out. The dollar on top is
 * derived at the platform rate. Showing both means the quoted currency is
 * prominent without the settled one being hidden, which on a screen about
 * somebody's money is the difference between a convenience and a misdirection.
 *
 * A rate of zero means none is on file. Rather than divide by it and print a
 * confident wrong number, the naira figure stands alone.
 */
export function Amount({
  naira,
  rate,
  className = "",
  size = "lg",
}: {
  naira: number;
  rate: number;
  className?: string;
  size?: "lg" | "md";
}) {
  const known = rate > 0;

  const big =
    size === "lg"
      ? "text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] tabular-nums"
      : "text-[0.9375rem] font-semibold tabular-nums";
  const small = size === "lg" ? "mt-1 text-[0.8125rem]" : "mt-[2px] text-xs";

  if (!known) {
    return (
      <p className={`${big} ${className}`}>{money(naira, { decimals: 2 })}</p>
    );
  }

  return (
    <div className={className}>
      <p className={big}>{usd(ngnToUsd(naira, rate))}</p>
      <p className={`${small} tabular-nums text-mist-400`}>
        {money(naira, { decimals: 2 })}
      </p>
    </div>
  );
}
