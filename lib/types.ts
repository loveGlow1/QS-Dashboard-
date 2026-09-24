/**
 * Row shapes for the QuickStark database.
 *
 * These mirror the live Supabase schema. Financial figures arrive as numeric
 * from Postgres; the client never computes them, it only formats them.
 */

export type PlanStatus = "open" | "waitlist" | "closed";
export type InvestmentStatus = "active" | "matured" | "cancelled";
/* `release` is written by mature_referral_bonuses when a referral bonus
   becomes spendable. */
export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "investment"
  | "return"
  | "release";
/* `cancelled` is a withdrawal the customer pulled back. The row stays so the
   history shows what happened; spendable_balance stops holding against it. */
export type TransactionStatus = "completed" | "pending" | "failed" | "cancelled";

/**
 * How far an account has been verified.
 *
 * EMAIL_VERIFIED is the starter tier and the only one the platform grants
 * today. The KYC levels exist so Persona can be slotted in without a second
 * migration of everything that reads this.
 */
export type VerificationTier = "EMAIL_VERIFIED" | "KYC_LEVEL_1" | "KYC_LEVEL_2";

export interface Profile {
  id: string;
  first_name: string;
  full_name: string;
  tier: string;
  /**
   * The spec's `is_verified`, under the name every gate in this codebase
   * already reads. Derived by the database from the address being activated;
   * never written by hand and not writable by the account holder.
   */
  verified: boolean;
  /** When the address was activated. Null until it is. */
  email_verified_at: string | null;
  /** Null until activated. */
  verification_tier: VerificationTier | null;
  created_at: string;
}

export type PlanTier = "silver" | "gold" | "vip";

export interface Plan {
  /** What the tier card shows. Separate from minimum and maximum, which are
      the naira amounts the server enforces — see the plans migration. */
  usd_minimum: number | null;
  usd_maximum: number | null;
  id: string;
  name: string;
  summary: string;
  minimum: number;
  /** Upper bound of the tier's range. Null means no stated ceiling. */
  maximum: number | null;
  /** Visual treatment only — carries no financial meaning. */
  tier: PlanTier;
  term_label: string;
  /** Length of the term in days. Every tier runs 30. */
  term_days: number;
  status: PlanStatus;
  eligibility: string;
  featured: boolean;
  features: string[];
  sort_order: number;
}

export interface Investment {
  id: string;
  user_id: string;
  /** The plan's key, e.g. "vip". A slug, never shown to a customer. */
  plan_id: string;
  /** What the plan is called: "Gold", "VIP Premium". Shown instead of the
      slug, which capitalises into "Vip" and reads like a typo. */
  plan_name: string;
  /** The plan's tier, so a status badge can wear its colour. */
  plan_tier: PlanTier;
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
  /** Path of the receipt in the private bucket, when a deposit carried one.
      Not a URL — a link is signed on demand and expires. */
  receipt_path?: string | null;
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
  /** Investments plus cash plus referral bonuses earned but not released. */
  total_value: number;
  active_count: number;
  /** Referral bonuses earned and still maturing. Counted in total_value,
      deliberately not in withdrawable — they are not cash yet. */
  referral_pending: number;
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
  /** Turned down by the back office. The amount goes back to the balance. */
  | "rejected"
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

/**
 * What a client component is allowed to know about a payout destination.
 *
 * Deliberately has no account_number. Props handed to a client component are
 * serialised into the page payload, so passing the full number would ship it
 * in the HTML of every render — visible to anything reading the document,
 * for no benefit: the screen only ever shows the last four digits.
 */
export interface BankAccountView {
  id: string;
  bank_name: string;
  account_name: string;
  /** The last four digits, the only part ever displayed. */
  last4: string;
  verified: boolean;
  is_default: boolean;
}

/** Narrows a stored account to the part the browser may hold. */
export function toBankAccountView(account: BankAccount): BankAccountView {
  return {
    id: account.id,
    bank_name: account.bank_name,
    account_name: account.account_name,
    last4: account.account_number.slice(-4),
    verified: account.verified,
    is_default: account.is_default,
  };
}

/** `4821` → `••••4821`. The only form an account number is shown in. */
export function maskAccount(last4: string): string {
  return `\u2022\u2022\u2022\u2022${last4}`;
}

/* ------------------------------------------------------------------ *
 * Payout methods
 * ------------------------------------------------------------------ */

export type PayoutKind = "bank" | "crypto";

/**
 * A withdrawal method as the server defines it.
 *
 * `enabled` says whether a payout can genuinely be made this way, not whether
 * the screen exists. A disabled method is shown with its reason rather than
 * hidden, so a customer is never walked into a flow that fails at the end.
 */
export interface PayoutMethod {
  id: string;
  label: string;
  subtitle: string;
  kind: PayoutKind;
  asset_code: string | null;
  enabled: boolean;
  unavailable_reason: string;
  minimum_amount: number;
  fee_percent: number;
  fee_flat: number;
  fee_cap: number | null;
  processing_time_label: string;
  sort_order: number;
}

export interface PayoutNetwork {
  id: string;
  method_id: string;
  label: string;
  /** Anchored pattern the destination address must match. */
  address_regex: string;
  address_hint: string;
  enabled: boolean;
  network_fee: number;
  minimum_amount: number;
  sort_order: number;
}

/* ------------------------------------------------------------------ *
 * Deposits
 * ------------------------------------------------------------------ */

export type DepositKind = "bank" | "card" | "crypto";

export type DepositStatus =
  | "pending"
  | "waiting_for_confirmations"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface DepositMethod {
  id: string;
  label: string;
  subtitle: string;
  kind: DepositKind;
  asset_code: string | null;
  /** Whether money can genuinely be received and credited this way. */
  enabled: boolean;
  unavailable_reason: string;
  minimum_amount: number;
  fee_percent: number;
  fee_flat: number;
  required_confirmations: number;
  processing_time_label: string;
  sort_order: number;
}

export interface DepositNetwork {
  id: string;
  method_id: string;
  label: string;
  address_hint: string;
  enabled: boolean;
  minimum_amount: number;
  required_confirmations: number;
  sort_order: number;
}

/**
 * Where a customer is told to send money.
 *
 * Only ever provisioned by the provider that controls the destination. The
 * application never generates one: an address it invented would take real
 * funds somewhere nobody can recover them.
 */
export interface DepositDestination {
  id: string;
  method_id: string;
  network_id: string | null;
  destination: string;
  bank_name: string;
  account_name: string;
  reference: string;
  /** Initials of the person responsible for the receiving account. Empty
      where nobody is named. */
  overseen_by: string;
  provider: string;
  active: boolean;
}

export interface Deposit {
  id: string;
  method_id: string;
  network_id: string | null;
  reference: string;
  amount: number;
  fee_amount: number;
  credited_amount: number;
  asset_code: string;
  /** The naira rate this deposit was credited at, recorded by credit_deposit
      so a naira figure can be checked against the amount that arrived. */
  rate_to_ngn: number | null;
  status: DepositStatus;
  confirmations: number;
  tx_hash: string | null;
  failure_reason: string | null;
  /** Path of the receipt in the private bucket. Not a URL — a link is signed
      on demand and expires. */
  proof_of_payment_url: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ReferralSummary {
  code: string;
  rate_percent: number;
  window_hours: number;
  maturity_days: number;
  enabled: boolean;
  /** Accounts that signed up with this code. */
  signups: number;
  /** Of those, how many funded an account inside the window and earned. */
  funded: number;
  pending_amount: number;
  matured_amount: number;
}

export type ReferralBonusStatus = "pending" | "matured" | "cancelled";

export interface ReferralBonus {
  id: string;
  base_amount: number;
  rate_percent: number;
  amount: number;
  status: ReferralBonusStatus;
  earned_at: string;
  matures_at: string;
}

export interface PlatformSettings {
  /** Naira per dollar. Every dollar figure shown is derived from a naira
      amount at this rate. */
  usd_ngn_rate: number;
  updated_at: string;
}
