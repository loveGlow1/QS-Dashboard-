"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";

/**
 * Deposit actions.
 *
 * There is exactly one of these, and it records a claim rather than money.
 *
 * A card payment or a crypto send announces itself — a provider webhook or a
 * chain confirmation arrives without anyone asking. A bank transfer does not,
 * so the customer has to say they sent one before anybody can go looking for
 * it. What that writes is a pending row. Only credit_deposit, which is
 * service-role and runs after the money is confirmed to have landed, turns a
 * deposit into balance; a customer declaring a transfer they never made moves
 * their balance by exactly zero.
 */

export interface DepositActionState {
  error: string | null;
  success?: string | null;
}

function readable(message: string): string {
  const cleaned = message.replace(/^.*?:\s*/, "").trim();
  if (!cleaned || /duplicate key|violates|constraint/i.test(cleaned)) {
    return "That could not be recorded. Please check the details and try again.";
  }
  return cleaned;
}

export async function declareTransfer(
  _prev: DepositActionState,
  formData: FormData,
): Promise<DepositActionState> {
  try {
    const user = await getUser();
    if (!user) return { error: "You must be signed in." };

    const destinationId = String(formData.get("destination_id") ?? "").trim();
    const raw = String(formData.get("amount") ?? "").replace(/[₦,\s]/g, "");
    const amount = Number(raw);

    if (!destinationId) return { error: "Choose where you transferred to." };
    if (!raw) return { error: "Enter the amount you transferred." };
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: "Enter the amount you transferred." };
    }

    /* The database re-checks that this destination belongs to the caller and
       forces the row to pending; these checks are for the message, not the
       money. */
    const supabase = await createClient();
    const { error } = await supabase.rpc("declare_deposit", {
      p_destination_id: destinationId,
      p_amount: amount,
    });

    if (error) return { error: readable(error.message) };

    revalidatePath("/deposit");
    return {
      error: null,
      success:
        "Recorded. Your balance updates once the transfer is confirmed as received.",
    };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "That could not be recorded. Please try again." };
  }
}
