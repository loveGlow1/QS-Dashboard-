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

export interface Plan {
  id: string;
  name: string;
  summary: string;
  minimum: number;
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

/** Portfolio totals, derived server-side from investments and snapshots. */
export interface PortfolioSummary {
  totalValue: number;
  invested: number;
  growth: number;
  growthPercent: number;
  available: number;
  activeCount: number;
  /** Empty when the account has no history yet. */
  series: SeriesPoint[];
}

export type ChartRange = "1M" | "3M" | "6M" | "1Y";
