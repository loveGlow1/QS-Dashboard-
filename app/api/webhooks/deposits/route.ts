import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceClient, hasServiceRoleKey } from "@/lib/supabase/service";

/**
 * Incoming deposit notifications from the custody provider.
 *
 * This is the only path that turns a payment into balance, and it is the one
 * endpoint on the platform that can create money, so the rules it follows are
 * narrow on purpose:
 *
 * 1. Unsigned requests are refused. If no signing secret is configured the
 *    endpoint refuses everything rather than trusting the open internet.
 * 2. The customer is resolved from the address that was paid, never from an
 *    identifier in the payload. A provider — or anyone forging one — cannot
 *    name whose account to credit.
 * 3. The amount, the rate and the fee are all applied server-side by
 *    credit_deposit. The payload says what arrived; the database decides what
 *    it is worth.
 * 4. Nothing is credited before the network's required confirmations, and a
 *    replayed notification credits once. record_deposit dedupes on the chain
 *    transaction and credit_deposit returns the transaction it already wrote.
 *
 * A failure returns 5xx so the provider retries. Returning 200 on an error
 * would lose a customer's deposit silently.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The shape every provider's payload is narrowed to before it is trusted. */
interface DepositEvent {
  address: string;
  asset: string;
  amount: number;
  txHash: string;
  confirmations: number;
}

function verify(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const given = signature.trim().replace(/^sha256=/, "");
  /* Both sides must be the same length before timingSafeEqual will compare
     them, and comparing lengths first is not itself a leak. */
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"));
}

/**
 * Narrow the provider's payload.
 *
 * Written against the fields every custody provider sends under one name or
 * another. When the provider is chosen, this is the function that changes —
 * nothing below it needs to.
 */
function parse(body: unknown): DepositEvent | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const address = String(b.address ?? b.to ?? b.destination ?? "").trim();
  const asset = String(b.asset ?? b.currency ?? b.coin ?? "").trim().toUpperCase();
  const txHash = String(b.txHash ?? b.txid ?? b.hash ?? b.transactionId ?? "").trim();
  const amount = Number(b.amount ?? b.value ?? b.valueString);
  const confirmations = Number(b.confirmations ?? b.confirmationCount ?? 0);

  if (!address || !asset || !txHash) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!Number.isFinite(confirmations) || confirmations < 0) return null;

  return { address, asset, amount, txHash, confirmations };
}

export async function POST(request: Request) {
  const secret = process.env.DEPOSIT_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[deposits] DEPOSIT_WEBHOOK_SECRET is not set; refusing the request.");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  if (!hasServiceRoleKey()) {
    console.error("[deposits] SUPABASE_SERVICE_ROLE_KEY is not set; cannot credit.");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const raw = await request.text();
  const signature =
    request.headers.get("x-signature") ??
    request.headers.get("x-webhook-signature") ??
    request.headers.get("x-hub-signature-256");

  if (!verify(raw, signature, secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let event: DepositEvent | null;
  try {
    event = parse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "malformed body" }, { status: 400 });
  }
  if (!event) {
    return NextResponse.json({ error: "unrecognised payload" }, { status: 400 });
  }

  const supabase = createServiceClient();

  /* Whose money this is: the customer holding that address right now.
     Addresses rotate through a pool, so the same one belongs to different
     people at different times and the question is about the lease, not the
     address. */
  const { data: leases, error: destError } = await supabase.rpc("resolve_deposit_lease", {
    p_address: event.address,
    p_network: null,
  });

  if (destError) {
    console.error("[deposits] lease lookup failed", destError);
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }

  const destination = (leases as
    | { destination_id: string; user_id: string; method_id: string; network_id: string | null; live: boolean }[]
    | null)?.[0];

  if (!destination) {
    /* An address this platform never issued. */
    console.error("[deposits] payment to an unknown address", {
      address: event.address,
      txHash: event.txHash,
    });
    return NextResponse.json({ error: "unknown destination" }, { status: 409 });
  }

  if (!destination.live) {
    /* The lease had expired when this arrived. The money is real and it is
       somebody's, but the records cannot say whose without guessing, and a
       guess here pays one customer with another's deposit. Record it for a
       human and do not credit. 200, because the provider has delivered
       correctly and retrying will not make the lease live again. */
    console.error("[deposits] payment to an expired lease — needs manual attribution", {
      address: event.address,
      txHash: event.txHash,
      lastHolder: destination.user_id,
    });
    return NextResponse.json(
      { error: "expired lease", attributed: false, review: true },
      { status: 200 },
    );
  }

  const { data: depositId, error: recordError } = await supabase.rpc("record_deposit", {
    p_user: destination.user_id,
    p_method: destination.method_id,
    p_network: destination.network_id,
    p_destination_id: destination.destination_id,
    p_amount: event.amount,
    p_asset_code: event.asset,
    p_tx_hash: event.txHash,
    p_confirmations: event.confirmations,
  });

  if (recordError || !depositId) {
    console.error("[deposits] record_deposit failed", recordError);
    return NextResponse.json({ error: "could not record" }, { status: 500 });
  }

  const { data: transactionId, error: creditError } = await supabase.rpc("credit_deposit", {
    p_deposit_id: depositId,
    p_confirmations: event.confirmations,
  });

  if (creditError) {
    /* A missing or stale rate lands here. The deposit is recorded and will be
       credited by a later notification, or by hand, once the rate is set —
       but the provider should retry, so this is not a 200. */
    console.error("[deposits] credit_deposit failed", creditError);
    return NextResponse.json({ error: "could not credit" }, { status: 500 });
  }

  return NextResponse.json({
    deposit: depositId,
    credited: Boolean(transactionId),
    confirmations: event.confirmations,
  });
}
