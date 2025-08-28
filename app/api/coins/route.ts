import { NextResponse } from 'next/server';
import { getWatchedCoins } from '@/data/coins';
import { safeFetch } from '@/lib/safeFetch';

// Returns lightweight watched coin metadata; logos can be hydrated separately later.
export const revalidate = 300; // 5 min ISR

export async function GET() {
  try {
    const coins = await getWatchedCoins();
    return NextResponse.json({ coins, ts: Date.now() });
  } catch (e: any) {
    return NextResponse.json({ coins: [], error: e?.message || 'failed' }, { status: 500 });
  }
}
