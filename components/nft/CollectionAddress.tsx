"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';

export function CollectionAddress({ address }: { address: string }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const t = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(t);
    }, [copied]);

    const scanUrl = `https://scan.coredao.org/address/${address}`;

    async function copy() {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
        } catch {/* ignore */ }
    }

    return (
        <div className="flex items-center gap-1 text-xs font-mono break-all">
            <a
                href={scanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-teal-300 underline decoration-dotted transition-colors"
                title="View on CoreScan"
            >
                {address}
            </a>
            <Button
                type="button"
                onClick={copy}
                size="icon"
                variant="ghost"
                className="p-1 -m-1 text-white/50 hover:text-white"
                aria-label={copied ? 'Copied' : 'Copy address'}
                title={copied ? 'Copied!' : 'Copy address'}
            >
                {copied ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                    </svg>
                ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="8" y="8" width="12" height="12" rx="2" ry="2" />
                        <path d="M4 16V6a2 2 0 0 1 2-2h10" />
                    </svg>
                )}
            </Button>
        </div>
    );
}
