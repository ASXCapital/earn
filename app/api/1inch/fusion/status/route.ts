import { NextResponse } from "next/server";
import { getFusionSdk } from "@/lib/oneinch-fusion";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderHash = searchParams.get("orderHash");
  if (!orderHash) {
    return NextResponse.json({ error: "orderHash is required" }, { status: 400 });
  }
  try {
    const sdk = getFusionSdk();
    const data = await sdk.getOrderStatus(orderHash);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    const message = e?.message || "Fusion status failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
