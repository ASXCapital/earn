import { NextResponse } from "next/server";
export const runtime = "nodejs";

const RELAYER_URL = "https://api.1inch.dev/fusion/relayer/v2.0/56/order/submit";

type SubmitBody = {
  order: any;
  signature: string;
  quoteId: string;
  extension: string;
};

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (!raw) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }
    let body: SubmitBody;
    try {
      body = JSON.parse(raw) as SubmitBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (!body?.order || !body?.signature || !body?.quoteId || !body?.extension) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const authKey = process.env.ONEINCH_API_KEY;
    if (!authKey) {
      return NextResponse.json({ error: "ONEINCH_API_KEY is not set" }, { status: 500 });
    }

    const resp = await fetch(RELAYER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order: body.order,
        signature: body.signature,
        quoteId: body.quoteId,
        extension: body.extension,
      }),
    });

    const text = await resp.text();
    let parsed: any = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { error: text };
      }
    }
    if (!resp.ok) {
      return NextResponse.json(parsed || { error: "Fusion submit failed" }, { status: resp.status });
    }
    return NextResponse.json(parsed || {}, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Fusion submit failed" }, { status: 500 });
  }
}
