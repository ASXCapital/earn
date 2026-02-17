import { NextResponse } from "next/server";
import { getFusionSdk } from "@/lib/oneinch-fusion";

export const runtime = "nodejs";

type QuoteBody = {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress?: string;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function isAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (!raw) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }
    let body: QuoteBody;
    try {
      body = JSON.parse(raw) as QuoteBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body?.fromTokenAddress || !body?.toTokenAddress || !body?.amount) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (!isAddress(body.fromTokenAddress) || !isAddress(body.toTokenAddress)) {
      return NextResponse.json({ error: "Invalid token address." }, { status: 400 });
    }

    const walletAddress = body.walletAddress && isAddress(body.walletAddress)
      ? body.walletAddress
      : ZERO_ADDRESS;

    const sdk = getFusionSdk();
    const quote = await sdk.getQuote({
      fromTokenAddress: body.fromTokenAddress,
      toTokenAddress: body.toTokenAddress,
      amount: body.amount,
      walletAddress,
      enableEstimate: true,
      source: "asx-zap",
    });

    return NextResponse.json({
      fromTokenAmount: quote.fromTokenAmount.toString(),
      toTokenAmount: String(quote.toTokenAmount || "0"),
      marketAmount: quote.marketReturn.toString(),
      quoteId: quote.quoteId,
      recommendedPreset: quote.recommendedPreset,
      settlementAddress: quote.settlementAddress.toString(),
    });
  } catch (e: any) {
    const message = e?.message || "Fusion quote failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

