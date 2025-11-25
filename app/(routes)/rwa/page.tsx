import Link from 'next/link';
import { RwaTabs } from '@/components/nft/RwaTabs';

export default function Page() {
    return (
        <div className="space-y-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold tracking-tight">NFT / RWA</h1>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/marketplace"
                        className="inline-flex items-center justify-center rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow shadow-teal-800/30 transition hover:bg-white/20"
                    >
                        Launch Marketplace
                    </Link>
                    <Link
                        href="/docs"
                        className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white/70 underline underline-offset-4 transition hover:text-white"
                    >
                        Read Terms
                    </Link>
                </div>
            </div>
            <RwaTabs />
        </div>
    );
}
