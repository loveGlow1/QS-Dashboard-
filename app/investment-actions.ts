"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";

/**
 * Placing an investment.
 *
 * The amount is naira, because the balance it comes out of is naira. The
 * dollar figure the customer typed is converted on the way in, at the same
 * platform rate every other screen uses, and the database re-checks the plan's
 * floor, the plan's status and the balance before writing anything. The checks
 * here exist so the message is readable, not because they are what protects
 * the money.
 */

export interface InvestState {
  error: string | null;
  success?: string | null;
}

function readable(message: string): string {
  const cleaned = message.replace(/^.*?:\s*/, "").trim();
  if (!cleaned || /duplicate key|violates|constraint/i.test(cleaned)) {
    return "That could not be completed. Please check the amount and try again.";
  }
  return cleaned;
}

export async function placeInvestment(
  _prev: InvestState,
  formData: FormData,
): Promise<InvestState> {
  try {
    const user = await getUser();
    if (!user) return { error: "You must be signed in." };

    const planId = String(formData.get("plan_id") ?? "").trim();
    const raw = String(formData.get("amount") ?? "").replace(/[$,\s]/g, "");
    const dollars = Number(raw);

    if (!planId) return { error: "Choose a plan." };
    if (!raw) return { error: "Enter an amount to invest." };
    if (!Number.isFinite(dollars) || dollars <= 0) {
      return { error: "Enter an amount to invest." };
    }

    const supabase = await createClient();

    const { data: settings } = await supabase
      .from("platform_settings")
      .select("usd_ngn_rate")
      .maybeSingle();
    const rate = Number((settings as { usd_ngn_rate: number } | null)?.usd_ngn_rate);
    if (!Number.isFinite(rate) || rate <= 0) {
      return { error: "Investments are unavailable right now. Please try again shortly." };
    }

    /* Rounded to the kobo the ledger works in, so the naira written is the
       naira checked. */
    const naira = Math.round(dollars * rate * 100) / 100;

    const { error } = await supabase.rpc("place_investment", {
      p_plan_id: planId,
      p_amount: naira,
    });
    if (error) return { error: readable(error.message) };

    revalidatePath("/investments");
    revalidatePath("/dashboard");
    return { error: null, success: "Your investment is active." };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "That could not be completed. Please try again." };
  }
}
