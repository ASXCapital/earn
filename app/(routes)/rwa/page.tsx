import dynamic from 'next/dynamic';
import Link from 'next/link';

const NftDashboard = dynamic(() => import('@/components/nft/Dashboard'), { ssr: true });

export default function Page() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold tracking-tight">NFT / RWA</h1>
                <Link href="/docs" className="text-sm text-white/70 hover:text-white underline underline-offset-4">Read Terms</Link>
            </div>
            <NftDashboard />
        </div>
    );
}
