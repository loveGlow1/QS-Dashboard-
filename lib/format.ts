/**
 * Presentation helpers. These format values — they never derive them.
 */

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;

export const NAIRA = "₦";

/** `1284500` → `₦1,284,500` */
export function money(value: number, opts: { decimals?: number; signed?: boolean } = {}): string {
  const decimals = opts.decimals ?? 0;
  const n = Number(value) || 0;
  const sign = n < 0 ? "-" : opts.signed && n > 0 ? "+" : "";
  const body = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign}${NAIRA}${body}`;
}

/** Axis labels: `1284500` → `₦1.28M` */
export function compactMoney(value: number): string {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${NAIRA}${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${NAIRA}${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${NAIRA}${Math.round(n / 1e3)}K`;
  return `${NAIRA}${Math.round(n)}`;
}

/** `7.043` → `+7.04%` */
export function percent(value: number, decimals = 2): string {
  const n = Number(value) || 0;
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toFixed(decimals)}%`;
}

/** ISO date → `19 Dec 2026` */
export function formatDate(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** ISO date → `19 Dec` */
export function formatDateShort(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function daysBetween(a: string | Date, b: string | Date): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function initials(name: string): string {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
