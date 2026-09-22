/**
 * Row shapes for the QuickStark database.
 *
 * These mirror the live Supabase schema. Financial figures arrive as numeric
 * from Postgres; the client never computes them, it only formats them.
 */

export type PlanStatus = "open" | "waitlist" | "closed";
export type InvestmentStatus = "active" | "matured" | "cancelled";
export type TransactionType = "deposit" | "withdrawal" | "investment" | "return";
export type TransactionStatus = "completed" | "pending" | "failed";

export interface Profile {
  id: string;
  first_name: string;
  full_name: string;
  tier: string;
  verified: boolean;
  created_at: string;
}

export type PlanTier = "silver" | "gold" | "vip";

export interface Plan {
  id: string;
  name: string;
  summary: string;
  minimum: number;
  /** Upper bound of the tier's range. Null means no stated ceiling. */
  maximum: number | null;
  /** Visual treatment only — carries no financial meaning. */
  tier: PlanTier;
  term_label: string;
  term_months: number;
  status: PlanStatus;
  eligibility: string;
  featured: boolean;
  features: string[];
  sort_order: number;
}

export interface Investment {
  id: string;
  user_id: string;
  plan_id: string;
  principal: number;
  current_value: number;
  start_date: string;
  maturity_date: string;
  status: InvestmentStatus;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  investment_id: string | null;
  type: TransactionType;
  label: string;
  method: string;
  amount: number;
  status: TransactionStatus;
  reference: string | null;
  occurred_at: string;
  created_at: string;
}

export interface PortfolioSnapshot {
  user_id: string;
  as_of: string;
  value: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  icon: string;
  unread: boolean;
  created_at: string;
}

export interface PlatformMetrics {
  members: number;
  total_invested: number;
  active_investments: number;
  open_plans: number;
  updated_at: string;
}

/** A point on the portfolio chart. */
export interface SeriesPoint {
  date: string;
  value: number;
}

/**
 * Row shape of the `portfolio_totals` view.
 *
 * Every figure here is derived by the database from investments and the
 * completed ledger. The client reads these; it never recomputes them, so the
 * number on screen and the number the server would act on cannot disagree.
 */
export interface PortfolioTotals {
  user_id: string;
  invested: number;
  investment_value: number;
  growth: number;
  growth_percent: number;
  available: number;
  /** Held against pending withdrawal requests, so it cannot be spent twice. */
  pending_out: number;
  withdrawable: number;
  total_value: number;
  active_count: number;
}

/** Portfolio totals plus the chart range the page asked for. */
export interface PortfolioSummary extends PortfolioTotals {
  /** Empty when the account has no history yet. */
  series: SeriesPoint[];
}

export type ChartRange = "1M" | "3M" | "6M" | "1Y";

/* ------------------------------------------------------------------ *
 * Withdrawals
 * ------------------------------------------------------------------ */

export type WithdrawalStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  bank_code: string;
  /** Full number. Masked at every point it is rendered. */
  account_number: string;
  account_name: string;
  /** Set by account verification, never by the account holder. */
  verified: boolean;
  verified_at: string | null;
  is_default: boolean;
  created_at: string;
}

/** The terms the server applies. The browser only displays them. */
export interface WithdrawalSettings {
  minimum_amount: number;
  fee_percent: number;
  fee_flat: number;
  fee_cap: number | null;
  processing_time_label: string;
}

export interface Withdrawal {
  id: string;
  reference: string;
  bank_account_id: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  status: WithdrawalStatus;
  failure_reason: string | null;
  created_at: string;
  processed_at: string | null;
}

/** `0123456789` → `••••6789`. The only form an account number is shown in. */
export function maskAccount(accountNumber: string): string {
  return `\u2022\u2022\u2022\u2022${accountNumber.slice(-4)}`;
}
