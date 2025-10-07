import Link from 'next/link';
import { RwaTabs } from '@/components/nft/RwaTabs';

export default function Page() {
    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold tracking-tight">NFT / RWA</h1>
                <Link href="/docs" className="text-sm text-white/70 hover:text-white underline underline-offset-4">Read Terms</Link>
            </div>
            <RwaTabs />
        </div>
    );
}
