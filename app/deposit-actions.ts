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
  /** The reference the customer should quote. Set on a filed claim. */
  reference?: string | null;
  /** What they said they sent, echoed back on the success card. */
  amount?: number | null;
}

/** What the proof bucket accepts, mirrored from the bucket's own settings. */
const PROOF_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
const PROOF_MAX_BYTES = 5 * 1024 * 1024;

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
    const txHash = String(formData.get("tx_hash") ?? "").trim() || null;
    const proof = formData.get("proof");

    if (!destinationId) return { error: "Choose where you transferred to." };
    if (!raw) return { error: "Enter the amount you transferred." };
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: "Enter the amount you transferred." };
    }

    const supabase = await createClient();

    /* The receipt goes into a private bucket, under a folder named after the
       customer's own id — which is also what the bucket's policy checks, so
       a tampered path cannot write into anybody else's folder. The path is
       stored; the back office signs a link when it wants to look. */
    let proofPath: string | null = null;
    if (proof instanceof File && proof.size > 0) {
      if (!PROOF_TYPES.includes(proof.type)) {
        return { error: "Attach a PNG, JPG, WEBP or PDF." };
      }
      if (proof.size > PROOF_MAX_BYTES) {
        return { error: "That file is over 5MB. Attach a smaller one." };
      }

      const suffix = proof.name.includes(".") ? proof.name.split(".").pop() : "bin";
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${suffix}`;
      const { error: uploadError } = await supabase.storage
        .from("deposit-proofs")
        .upload(path, proof, { contentType: proof.type, upsert: false });

      if (uploadError) {
        return { error: "That receipt could not be attached. Try again, or file without it." };
      }
      proofPath = path;
    }

    /* The database re-checks that this destination belongs to the caller, that
       the amount clears the method's minimum, and forces the row to pending;
       the checks above are for the message, not the money. */
    const { data, error } = await supabase.rpc("declare_deposit", {
      p_destination_id: destinationId,
      p_amount: amount,
      p_tx_hash: txHash,
      p_proof_url: proofPath,
    });

    if (error) return { error: readable(error.message) };

    /* Read the reference back rather than inventing one to show. */
    const { data: row } = await supabase
      .from("deposits")
      .select("reference")
      .eq("id", data as string)
      .maybeSingle();

    revalidatePath("/deposit");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return {
      error: null,
      success: "Recorded. Your balance updates once the payment is confirmed as received.",
      reference: (row as { reference: string } | null)?.reference ?? null,
      amount,
    };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "That could not be recorded. Please try again." };
  }
}

/**
 * Ask for a deposit address.
 *
 * Addresses come from a rotating pool, so one is leased on request rather
 * than handed out in advance — a customer who only opens the page and leaves
 * should not hold an address nobody is sending to. Asking again returns the
 * lease they already have.
 */
export async function requestDepositAddress(
  _prev: DepositActionState,
  formData: FormData,
): Promise<DepositActionState> {
  try {
    const user = await getUser();
    if (!user) return { error: "You must be signed in." };

    const method = String(formData.get("method_id") ?? "").trim();
    const network = String(formData.get("network_id") ?? "").trim() || null;
    if (!method) return { error: "Choose a method first." };

    const supabase = await createClient();
    const { error } = await supabase.rpc("lease_deposit_address", {
      p_method: method,
      p_network: network,
    });

    if (error) return { error: readable(error.message) };

    revalidatePath("/deposit");
    return { error: null, success: null };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "That could not be completed. Please try again." };
  }
}

/**
 * A short-lived link to a receipt the customer uploaded.
 *
 * The bucket is private and the stored value is a path, not a URL. The link
 * is signed here, under the caller's own session, so the storage policy still
 * decides: a path in somebody else's folder signs nothing.
 */
export async function receiptLink(path: string): Promise<{ url: string | null }> {
  try {
    const user = await getUser();
    if (!user || !path) return { url: null };

    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("deposit-proofs")
      .createSignedUrl(path, 120);

    return { url: data?.signedUrl ?? null };
  } catch (error) {
    unstable_rethrow(error);
    return { url: null };
  }
}
