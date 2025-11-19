import { NextResponse } from "next/server";
import superjson from "superjson";

import { fetchMarketplaceFeed } from "@/components/marketplace/services/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await fetchMarketplaceFeed();
    return new NextResponse(superjson.stringify(payload), {
      headers: {
        "Cache-Control": "s-maxage=20, stale-while-revalidate=40",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to load marketplace feed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
