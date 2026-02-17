import { NextResponse } from "next/server";
import { NetworkEnum, PresetEnum } from "@1inch/fusion-sdk";
import { getFusionSdk, normalizeBigInt } from "@/lib/oneinch-fusion";

export const runtime = "nodejs";

type PrepareBody = {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
  slippage?: number;
};

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (!raw) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }
    let body: PrepareBody;
    try {
      body = JSON.parse(raw) as PrepareBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (!body?.fromTokenAddress || !body?.toTokenAddress || !body?.amount || !body?.walletAddress) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const sdk = getFusionSdk();
    const prepared = await sdk.createOrder({
      fromTokenAddress: body.fromTokenAddress,
      toTokenAddress: body.toTokenAddress,
      amount: body.amount,
      walletAddress: body.walletAddress,
      preset: PresetEnum.fast,
      orderExpirationDelay: 300n,
      allowPartialFills: false,
      allowMultipleFills: false,
      source: "asx-zap",
    });

    const order = prepared.order;
    const orderStruct = normalizeBigInt(order.build());
    const typedData = normalizeBigInt(order.getTypedData(NetworkEnum.BINANCE));
    const extension = order.extension.encode();

    return NextResponse.json({
      quoteId: prepared.quoteId,
      orderHash: prepared.hash,
      order: orderStruct,
      typedData,
      extension,
      settlementAddress: order.settlementExtensionContract.toString(),
    });
  } catch (e: any) {
    const message = e?.message || "Fusion prepare failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
