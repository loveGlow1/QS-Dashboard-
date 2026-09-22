import { NextResponse, type NextRequest } from "next/server";
import { getSeries } from "@/lib/data";
import { getUser } from "@/lib/supabase/server";
import type { ChartRange } from "@/lib/types";

const RANGES = new Set<ChartRange>(["1M", "3M", "6M", "1Y"]);

function isRange(value: string | null): value is ChartRange {
  return value !== null && RANGES.has(value as ChartRange);
}

/**
 * One chart range for the signed-in customer.
 *
 * A route handler is a public endpoint, so the session is checked here
 * rather than assumed from the proxy, and the range is validated against a
 * fixed set before it reaches the database function.
 */
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const requested = request.nextUrl.searchParams.get("range");
  if (!isRange(requested)) {
    return NextResponse.json({ error: "Unknown range" }, { status: 400 });
  }

  const series = await getSeries(requested);
  return NextResponse.json({ range: requested, series });
}
