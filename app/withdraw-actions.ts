"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient, getUser } from "@/lib/supabase/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Withdrawal actions.
 *
 * A Server Action is a POST endpoint reachable by anyone who can send the
 * request, so nothing here trusts its input. The amount, the destination and
 * the fee are all re-decided by the database function that actually writes
 * the row — these handlers validate early so the customer gets a readable
 * message, not because the check here is what protects the money.
 */

export interface ActionState {
  error: string | null;
  success?: string | null;
  reference?: string | null;
}

/** Turns a Postgres RAISE into the sentence it was written as. */
function readable(message: string): string {
  const cleaned = message.replace(/^.*?:\s*/, "").trim();
  if (!cleaned || /duplicate key|violates|constraint/i.test(cleaned)) {
    return "That could not be completed. Please check the details and try again.";
  }
  return cleaned;
}

/**
 * Confirms the signed-in customer's password.
 *
 * Uses a throwaway client with no session persistence, so verifying the
 * password cannot disturb or replace the session the customer is using. A
 * wrong password returns false rather than throwing.
 */
async function passwordConfirmed(email: string, password: string): Promise<boolean> {
  if (!password) return false;
  try {
    const probe = createSupabaseClient(supabaseUrl(), supabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await probe.auth.signInWithPassword({ email, password });
    if (!error) await probe.auth.signOut();
    return !error;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * Destinations
 * ------------------------------------------------------------------ */

export async function addBankAccount(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "You must be signed in." };

  const bankName = String(formData.get("bank_name") ?? "").trim();
  const accountNumber = String(formData.get("account_number") ?? "").replace(/\s/g, "");
  const accountName = String(formData.get("account_name") ?? "").trim();

  if (!bankName) return { error: "Choose your bank." };
  if (!/^\d{10}$/.test(accountNumber)) {
    return { error: "A Nigerian account number is 10 digits." };
  }
  if (!accountName) return { error: "Enter the name on the account." };

  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").insert({
    user_id: user.id,
    bank_name: bankName,
    account_number: accountNumber,
    account_name: accountName,
  });

  if (error) {
    if (error.code === "23505") return { error: "That account is already saved." };
    return { error: readable(error.message) };
  }

  revalidatePath("/withdraw");
  return {
    error: null,
    success:
      "Account saved. It has to be verified against the bank before you can withdraw to it.",
  };
}

export async function removeBankAccount(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "You must be signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "That account could not be found." };

  const supabase = await createClient();
  /* Scoped by row level security to the caller's own rows regardless. */
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
  if (error) return { error: readable(error.message) };

  revalidatePath("/withdraw");
  return { error: null, success: "Account removed." };
}

/* ------------------------------------------------------------------ *
 * Requests
 * ------------------------------------------------------------------ */

export async function requestWithdrawal(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!user?.email) return { error: "You must be signed in." };

  const amount = Number(String(formData.get("amount") ?? "").replace(/,/g, ""));
  const bankAccountId = String(formData.get("bank_account_id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount to withdraw." };
  if (!bankAccountId) return { error: "Choose an account to pay out to." };

  /* Confirm the person at the keyboard before money leaves the balance. */
  if (!(await passwordConfirmed(user.email, password))) {
    return { error: "That password is not correct." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_withdrawal", {
    p_amount: amount,
    p_bank_account_id: bankAccountId,
  });

  if (error) return { error: readable(error.message) };

  /* Read back the reference the server generated rather than inventing one. */
  const { data: row } = await supabase
    .from("withdrawals")
    .select("reference")
    .eq("id", data as string)
    .maybeSingle();

  revalidatePath("/withdraw");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");

  return {
    error: null,
    success: "Your withdrawal request has been recorded.",
    reference: (row as { reference: string } | null)?.reference ?? null,
  };
}

export async function cancelWithdrawal(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "You must be signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "That request could not be found." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_withdrawal", { p_id: id });
  if (error) return { error: readable(error.message) };

  revalidatePath("/withdraw");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { error: null, success: "Request cancelled. The amount is back in your balance." };
}
