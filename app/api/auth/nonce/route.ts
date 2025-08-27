import { NextResponse } from 'next/server';

// Simple nonce endpoint for auth flows (e.g., SIWE or signature-based auth)
// Returns a random 32-char hex nonce. Extend with persistence / rate limiting as needed.
export async function GET() {
    // Use Web Crypto if available (Edge/runtime agnostic), else fallback.
    let bytes: Uint8Array;
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
        bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
    } else {
        const { randomBytes } = await import('crypto');
        const buf = randomBytes(16);
        bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    const nonce = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return NextResponse.json({ nonce, issuedAt: new Date().toISOString() });
}

// Optionally support POST for forward compatibility
export const POST = GET;
