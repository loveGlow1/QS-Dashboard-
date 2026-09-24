import "server-only";
import { unstable_rethrow } from "next/navigation";
import { titleCase } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type {
  BankAccount,
  ChartRange,
  Deposit,
  DepositDestination,
  DepositMethod,
  DepositNetwork,
  PayoutMethod,
  PayoutNetwork,
  Investment,
  Notification,
  Plan,
  PlanTier,
  PlatformMetrics,
  PortfolioSummary,
  PortfolioTotals,
  Profile,
  SeriesPoint,
  Transaction,
  Withdrawal,
  WithdrawalSettings,
  ReferralSummary,
  ReferralBonus,
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
  referral_pending: 0,
};

/**
 * The signed-in customer's profile.
 *
 * Names are capitalised here rather than at each place one is shown. Doing it
 * per screen means the next screen forgets — the greeting and the account menu
 * were capitalised while the profile page still read "jeph kofi". What is
 * stored is left exactly as the customer typed it; this is presentation.
 */
export async function getProfile(): Promise<Profile | null> {
  return safely("getProfile", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("*").maybeSingle();
    const row = data as Profile | null;
    if (!row) return null;
    return {
      ...row,
      first_name: titleCase(row.first_name ?? ""),
      full_name: titleCase(row.full_name ?? ""),
    };
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
    /* The plan is embedded rather than looked up per row: the name and the
       tier are what a holding is labelled and coloured with, and reading them
       from the plan means a rename lands everywhere at once. */
    const { data } = await supabase
      .from("investments")
      .select("*, plans(name, tier)")
      .order("start_date", { ascending: false });

    type Row = Omit<Investment, "plan_name" | "plan_tier"> & {
      plans: { name: string; tier: PlanTier } | null;
    };

    return ((data as Row[]) ?? []).map(({ plans, ...row }) => ({
      ...row,
      plan_name: plans?.name ?? row.plan_id,
      plan_tier: plans?.tier ?? "silver",
    }));
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
    /* The receipt belongs to the deposit, not the ledger row, so it is
       embedded rather than copied — one fact, one place. */
    let query = supabase
      .from("transactions")
      .select("*, deposits(proof_of_payment_url)")
      .order("occurred_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (opts.type && opts.type !== "all") query = query.eq("type", opts.type);
    if (opts.limit) query = query.limit(opts.limit);

    const { data } = await query;

    type Row = Transaction & { deposits: { proof_of_payment_url: string | null }[] | null };

    return ((data as Row[]) ?? []).map(({ deposits, ...row }) => ({
      ...row,
      receipt_path: deposits?.[0]?.proof_of_payment_url ?? null,
    }));
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
      referral_pending: Number(row.referral_pending),
      series,
    };
  }, empty);
}

/**
 * The deposit methods the platform offers, the networks each crypto method
 * accepts, and the destinations provisioned for this customer.
 *
 * A destination row exists only when a provider actually issued it, so a
 * screen can render an address or account number only when there is a real
 * one to render.
 */
export async function getDepositMethods(): Promise<DepositMethod[]> {
  return safely("getDepositMethods", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("deposit_methods")
      .select("*")
      .order("sort_order", { ascending: true });
    return ((data as DepositMethod[]) ?? []).map((m) => ({
      ...m,
      minimum_amount: Number(m.minimum_amount),
      fee_percent: Number(m.fee_percent),
      fee_flat: Number(m.fee_flat),
    }));
  }, []);
}

export async function getDepositNetworks(): Promise<DepositNetwork[]> {
  return safely("getDepositNetworks", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("deposit_networks")
      .select("*")
      .order("sort_order", { ascending: true });
    return ((data as DepositNetwork[]) ?? []).map((n) => ({
      ...n,
      minimum_amount: Number(n.minimum_amount),
    }));
  }, []);
}

export async function getDepositDestinations(): Promise<DepositDestination[]> {
  return safely("getDepositDestinations", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("deposit_destinations")
      .select("id, method_id, network_id, destination, bank_name, account_name, reference, provider, active")
      .eq("active", true);
    return (data as DepositDestination[]) ?? [];
  }, []);
}

export async function getDeposits(): Promise<Deposit[]> {
  return safely("getDeposits", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("deposits")
      .select("*")
      .order("created_at", { ascending: false });
    return ((data as Deposit[]) ?? []).map((d) => ({
      ...d,
      amount: Number(d.amount),
      fee_amount: Number(d.fee_amount),
      credited_amount: Number(d.credited_amount),
    }));
  }, []);
}

/**
 * The withdrawal methods the platform offers, and the networks each crypto
 * method can settle on. Read from the database so the page can never offer a
 * route the server would refuse.
 */
export async function getPayoutMethods(): Promise<PayoutMethod[]> {
  return safely("getPayoutMethods", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("payout_methods")
      .select("*")
      .order("sort_order", { ascending: true });
    return ((data as PayoutMethod[]) ?? []).map((m) => ({
      ...m,
      minimum_amount: Number(m.minimum_amount),
      fee_percent: Number(m.fee_percent),
      fee_flat: Number(m.fee_flat),
      fee_cap: m.fee_cap === null ? null : Number(m.fee_cap),
    }));
  }, []);
}

export async function getPayoutNetworks(): Promise<PayoutNetwork[]> {
  return safely("getPayoutNetworks", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("payout_networks")
      .select("*")
      .order("sort_order", { ascending: true });
    return ((data as PayoutNetwork[]) ?? []).map((n) => ({
      ...n,
      network_fee: Number(n.network_fee),
      minimum_amount: Number(n.minimum_amount),
    }));
  }, []);
}

/** The caller's own payout destinations. */
export async function getBankAccounts(): Promise<BankAccount[]> {
  return safely("getBankAccounts", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("bank_accounts")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    return (data as BankAccount[]) ?? [];
  }, []);
}

/** Withdrawal terms. Publicly readable; the server enforces them regardless. */
export async function getWithdrawalSettings(): Promise<WithdrawalSettings | null> {
  return safely("getWithdrawalSettings", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("withdrawal_settings")
      .select("minimum_amount, fee_percent, fee_flat, fee_cap, processing_time_label")
      .maybeSingle();
    if (!data) return null;
    const row = data as WithdrawalSettings;
    return {
      minimum_amount: Number(row.minimum_amount),
      fee_percent: Number(row.fee_percent),
      fee_flat: Number(row.fee_flat),
      fee_cap: row.fee_cap === null ? null : Number(row.fee_cap),
      processing_time_label: row.processing_time_label,
    };
  }, null);
}

/** The caller's own withdrawal requests, newest first. */
export async function getWithdrawals(): Promise<Withdrawal[]> {
  return safely("getWithdrawals", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false });
    return ((data as Withdrawal[]) ?? []).map((w) => ({
      ...w,
      gross_amount: Number(w.gross_amount),
      fee_amount: Number(w.fee_amount),
      net_amount: Number(w.net_amount),
    }));
  }, []);
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

/** The signed-in customer's referral code and what it has earned. */
export async function getReferralSummary(): Promise<ReferralSummary | null> {
  return safely("getReferralSummary", async () => {
    const supabase = await createClient();
    /* Matures anything that has come due before reading, so a bonus past its
       date is not sitting pending on a page that says it has matured. */
    await supabase.rpc("mature_referral_bonuses");
    const { data } = await supabase.rpc("referral_summary");
    const row = (data as ReferralSummary[] | null)?.[0];
    if (!row) return null;
    return {
      ...row,
      rate_percent: Number(row.rate_percent),
      signups: Number(row.signups),
      funded: Number(row.funded),
      pending_amount: Number(row.pending_amount),
      matured_amount: Number(row.matured_amount),
    };
  }, null);
}

/** Each bonus this customer has earned, newest first. */
export async function getReferralBonuses(): Promise<ReferralBonus[]> {
  return safely("getReferralBonuses", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("referral_bonuses")
      .select("id, base_amount, rate_percent, amount, status, earned_at, matures_at")
      .order("earned_at", { ascending: false });
    return ((data as ReferralBonus[] | null) ?? []).map((b) => ({
      ...b,
      base_amount: Number(b.base_amount),
      rate_percent: Number(b.rate_percent),
      amount: Number(b.amount),
    }));
  }, []);
}

/** The rate every dollar figure on the platform is derived at. */
export async function getUsdRate(): Promise<number> {
  return safely("getUsdRate", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      /* The rate alone. platform_settings also records who changed it and
         when, which no visitor needs, so the public view exposes one column. */
      .from("usd_rate")
      .select("usd_ngn_rate")
      .maybeSingle();
    const rate = Number((data as { usd_ngn_rate: number } | null)?.usd_ngn_rate);
    return Number.isFinite(rate) && rate > 0 ? rate : 0;
  }, 0);
}
