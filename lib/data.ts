import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  ChartRange,
  Investment,
  Notification,
  Plan,
  PlatformMetrics,
  PortfolioSummary,
  Profile,
  SeriesPoint,
  Transaction,
} from "@/lib/types";

/**
 * Server-side reads.
 *
 * Everything here runs with the signed-in customer's own credentials, so row
 * level security decides what comes back — the query does not have to be
 * trusted to scope itself correctly.
 *
 * No function in this module invents a financial figure. Totals are summed
 * from rows the database returned; nothing is estimated, projected or filled
 * in when data is missing. An account with no history gets zeroes and an
 * empty series, and the UI says so.
 */

const DAYS_IN_RANGE: Record<ChartRange, number> = {
  "1M": 30,
  "3M": 91,
  "6M": 182,
  "1Y": 365,
};

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").maybeSingle();
  return (data as Profile) ?? null;
}

export async function getPlans(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("*")
    .neq("status", "closed")
    .order("sort_order", { ascending: true });
  return (data as Plan[]) ?? [];
}

export async function getInvestments(): Promise<Investment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("investments")
    .select("*")
    .order("start_date", { ascending: false });
  return (data as Investment[]) ?? [];
}

export async function getTransactions(limit?: number): Promise<Transaction[]> {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("*")
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return (data as Transaction[]) ?? [];
}

export async function getNotifications(limit = 12): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Notification[]) ?? [];
}

export async function getSeries(range: ChartRange): Promise<SeriesPoint[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - DAYS_IN_RANGE[range]);

  const { data } = await supabase
    .from("portfolio_snapshots")
    .select("as_of, value")
    .gte("as_of", since.toISOString().slice(0, 10))
    .order("as_of", { ascending: true });

  return ((data as { as_of: string; value: number }[]) ?? []).map((row) => ({
    date: row.as_of,
    value: Number(row.value),
  }));
}

/**
 * Portfolio totals.
 *
 * `available` is the customer's uninvested cash, summed from the completed
 * ledger rows rather than held in a mutable balance column, so it cannot
 * drift away from the transactions that produced it.
 */
export async function getPortfolio(range: ChartRange = "6M"): Promise<PortfolioSummary> {
  const [investments, transactions, series] = await Promise.all([
    getInvestments(),
    getTransactions(),
    getSeries(range),
  ]);

  const active = investments.filter((i) => i.status === "active");
  const invested = active.reduce((sum, i) => sum + Number(i.principal), 0);
  const investedValue = active.reduce((sum, i) => sum + Number(i.current_value), 0);

  const available = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalValue = investedValue + Math.max(0, available);
  const growth = investedValue - invested;

  return {
    totalValue,
    invested,
    growth,
    growthPercent: invested > 0 ? (growth / invested) * 100 : 0,
    available: Math.max(0, available),
    activeCount: active.length,
    series,
  };
}

/** Public aggregates for the landing page. Readable without a session. */
export async function getPlatformMetrics(): Promise<PlatformMetrics | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("platform_metrics").select("*").maybeSingle();
  return (data as PlatformMetrics) ?? null;
}
