import { NextResponse } from "next/server";
import superjson from "superjson";

import { fetchMarketplaceFeed } from "@/components/marketplace/services/feed";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const payload = await fetchMarketplaceFeed();
    return new NextResponse(superjson.stringify(payload), {
      headers: {
        // Always serve fresh chain state; CDN/client caching caused stale listing results.
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to load marketplace feed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
