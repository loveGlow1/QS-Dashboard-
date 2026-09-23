import { money, ngnToUsd, usd } from "@/lib/format";

/**
 * A money figure, quoted in dollars with the naira it really is beneath.
 *
 * One component so every list, row and card converts at the same rate and in
 * the same shape. A rate of zero means none is on file, and the naira stands
 * alone rather than being divided by zero into a confident wrong number.
 */
export function Figure({
  naira,
  rate,
  signed = false,
  className = "",
  subClassName = "",
}: {
  naira: number;
  rate: number;
  signed?: boolean;
  className?: string;
  subClassName?: string;
}) {
  if (rate <= 0) {
    return <span className={className}>{money(naira, { decimals: 2, signed })}</span>;
  }

  const dollars = ngnToUsd(naira, rate);
  const sign = signed && naira > 0 ? "+" : "";

  return (
    <span className={`grid justify-items-end ${className}`}>
      <span>{`${sign}${usd(dollars)}`}</span>
      <span className={`text-xs font-normal tabular-nums text-mist-500 ${subClassName}`}>
        {money(naira, { decimals: 2, signed })}
      </span>
    </span>
  );
}
