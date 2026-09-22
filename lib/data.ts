import "server-only";
import { unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  ChartRange,
  Investment,
  Notification,
  Plan,
  PlatformMetrics,
  PortfolioSummary,
  PortfolioTotals,
  Profile,
  SeriesPoint,
  Transaction,
} from "@/lib/types";

/**
 * Server-side reads.
 *
 * Everything runs with the signed-in customer's own credentials, so row level
 * security decides what comes back — a query does not have to be trusted to
 * scope itself correctly.
 *
 * Financial figures are read from `portfolio_totals`, a view the database
 * derives from investments and the completed ledger. This module deliberately
 * does not re-add them up: a total computed here could disagree with the one
 * the server would act on, and the server's is the only one that counts.
 */

/**
 * Runs a read and returns `fallback` if it fails.
 *
 * A page that cannot reach the database should say it has nothing to show,
 * not return a 500. The error is logged so an outage is visible in the server
 * logs rather than silently swallowed.
 */
async function safely<T>(label: string, read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    /* Next signals control flow with thrown errors — a dynamic-rendering
       bailout, a redirect, a notFound. Swallowing those would leave the
       framework unable to do its job, so they go straight back up. */
    unstable_rethrow(error);
    console.error(`[data] ${label} failed`, error);
    return fallback;
  }
}

const EMPTY_TOTALS: Omit<PortfolioTotals, "user_id"> = {
  invested: 0,
  investment_value: 0,
  growth: 0,
  growth_percent: 0,
  available: 0,
  pending_out: 0,
  withdrawable: 0,
  total_value: 0,
  active_count: 0,
};

export async function getProfile(): Promise<Profile | null> {
  return safely("getProfile", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("*").maybeSingle();
    return (data as Profile) ?? null;
  }, null);
}

export async function getPlans(): Promise<Plan[]> {
  return safely("getPlans", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("plans")
      .select("*")
      .neq("status", "closed")
      .order("sort_order", { ascending: true });
    return (data as Plan[]) ?? [];
  }, []);
}

export async function getInvestments(): Promise<Investment[]> {
  return safely("getInvestments", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("investments")
      .select("*")
      .order("start_date", { ascending: false });
    return (data as Investment[]) ?? [];
  }, []);
}

export async function getActiveInvestment(): Promise<Investment | null> {
  const rows = await getInvestments();
  return rows.find((i) => i.status === "active") ?? null;
}

export async function getTransactions(
  opts: { limit?: number; type?: string } = {},
): Promise<Transaction[]> {
  return safely("getTransactions", async () => {
    const supabase = await createClient();
    let query = supabase
      .from("transactions")
      .select("*")
      .order("occurred_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (opts.type && opts.type !== "all") query = query.eq("type", opts.type);
    if (opts.limit) query = query.limit(opts.limit);

    const { data } = await query;
    return (data as Transaction[]) ?? [];
  }, []);
}

export async function getNotifications(limit = 12): Promise<Notification[]> {
  return safely("getNotifications", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as Notification[]) ?? [];
  }, []);
}

/** One chart range of the customer's own history, via the database function. */
export async function getSeries(range: ChartRange = "6M"): Promise<SeriesPoint[]> {
  return safely("getSeries", async () => {
    const supabase = await createClient();
    const { data } = await supabase.rpc("portfolio_series", { p_range: range });
    return ((data as { as_of: string; value: number }[]) ?? []).map((row) => ({
      date: row.as_of,
      value: Number(row.value),
    }));
  }, []);
}

/**
 * Portfolio totals and one chart range.
 *
 * An account with no history returns zeroes and an empty series rather than a
 * placeholder, and the dashboard says as much.
 */
export async function getPortfolio(range: ChartRange = "6M"): Promise<PortfolioSummary> {
  const series = await getSeries(range);
  const empty: PortfolioSummary = { user_id: "", ...EMPTY_TOTALS, series };

  return safely("getPortfolio", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("portfolio_totals").select("*").maybeSingle();
    const row = data as PortfolioTotals | null;

    if (!row) return empty;

    /* Postgres numeric arrives as a string over PostgREST once it exceeds the
       safe integer range, so coerce every figure rather than trusting the
       declared type. */
    return {
      user_id: row.user_id,
      invested: Number(row.invested),
      investment_value: Number(row.investment_value),
      growth: Number(row.growth),
      growth_percent: Number(row.growth_percent),
      available: Number(row.available),
      pending_out: Number(row.pending_out),
      withdrawable: Number(row.withdrawable),
      total_value: Number(row.total_value),
      active_count: Number(row.active_count),
      series,
    };
  }, empty);
}

/**
 * Whether the account has any recorded portfolio history at all.
 *
 * Distinguishes "never invested" from "nothing in the selected window",
 * which are different things to tell a customer. Asks for one row rather
 * than counting: the answer is the same and the query is cheaper.
 */
export async function hasPortfolioHistory(): Promise<boolean> {
  return safely("hasPortfolioHistory", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("portfolio_snapshots").select("as_of").limit(1);
    return ((data as unknown[]) ?? []).length > 0;
  }, false);
}

/** Public aggregates for the landing page. Readable without a session. */
export async function getPlatformMetrics(): Promise<PlatformMetrics | null> {
  return safely("getPlatformMetrics", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("platform_metrics").select("*").maybeSingle();
    return (data as PlatformMetrics) ?? null;
  }, null);
}

/**
 * Cumulative amount invested across the platform, by month. A public
 * aggregate: it carries no customer detail.
 */
export async function getPlatformSeries(): Promise<SeriesPoint[]> {
  return safely("getPlatformSeries", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("platform_monthly")
      .select("month, total_invested")
      .order("month", { ascending: true });

    return ((data as { month: string; total_invested: number }[]) ?? []).map((row) => ({
      date: row.month,
      value: Number(row.total_invested),
    }));
  }, []);
}
