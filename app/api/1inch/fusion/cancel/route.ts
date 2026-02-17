import { NextResponse } from "next/server";
import { ONE_INCH_LIMIT_ORDER_V4 } from "@1inch/fusion-sdk";
import { getFusionSdk } from "@/lib/oneinch-fusion";

export const runtime = "nodejs";

type CancelBody = {
  walletAddress: string;
};

const PENDING_STATUSES = new Set(["pending", "partially-filled"]);
const PAGE_LIMIT = 100;
const MAX_PAGES = 20;

function isAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (!raw) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    let body: CancelBody;
    try {
      body = JSON.parse(raw) as CancelBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body?.walletAddress || !isAddress(body.walletAddress)) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }

    const walletAddress = body.walletAddress.toLowerCase();
    const sdk = getFusionSdk();

    const candidateOrderHashes = new Set<string>();
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= MAX_PAGES) {
      const data: any = await sdk.getOrdersByMaker({
        address: walletAddress,
        page,
        limit: PAGE_LIMIT,
      });

      const items = Array.isArray(data?.items) ? data.items : [];
      for (const item of items) {
        const status = String(item?.status || "").toLowerCase();
        const orderHash = String(item?.orderHash || "");
        if (PENDING_STATUSES.has(status) && orderHash.length === 66) {
          candidateOrderHashes.add(orderHash);
        }
      }

      const nextTotal = Number(data?.meta?.totalPages || 1);
      if (Number.isFinite(nextTotal) && nextTotal > 0) {
        totalPages = nextTotal;
      } else if (!items.length) {
        break;
      }

      page += 1;
    }

    const hashes = Array.from(candidateOrderHashes);
    const statuses = await Promise.allSettled(hashes.map((orderHash) => sdk.getOrderStatus(orderHash)));
    const orderHashes: string[] = [];
    const makerTraits: string[] = [];

    statuses.forEach((result, index) => {
      if (result.status !== "fulfilled") return;
      const status = String((result.value as any)?.status || "").toLowerCase();
      if (!PENDING_STATUSES.has(status)) return;
      const makerTraitsRaw = (result.value as any)?.order?.makerTraits;
      if (makerTraitsRaw === undefined || makerTraitsRaw === null) return;
      try {
        const normalizedTraits = BigInt(String(makerTraitsRaw)).toString();
        orderHashes.push(hashes[index]);
        makerTraits.push(normalizedTraits);
      } catch {
        // skip malformed makerTraits
      }
    });

    return NextResponse.json({
      walletAddress,
      chainId: 56,
      contractAddress: ONE_INCH_LIMIT_ORDER_V4,
      orderHashes,
      makerTraits,
      pendingCount: orderHashes.length,
      scannedCount: hashes.length,
      truncated: totalPages > MAX_PAGES,
    });
  } catch (e: any) {
    const message = e?.message || "Fusion cancel lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

