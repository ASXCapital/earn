import { NextResponse } from 'next/server';
import { getPricesServer } from '@/lib/price';

export const revalidate = 60; // ISR caching

export async function GET() {
	const p = await getPricesServer();
	return NextResponse.json(p, { status: 200 });
}
