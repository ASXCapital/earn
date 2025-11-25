"use client";

import { ReactNode } from 'react';
import LegalTile from './LegalTile';

export function RwaHero() {
    return (
        <section className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-6 backdrop-blur-sm">
            <div className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(circle_at_25%_25%,white,transparent)]" />
            <div className="relative space-y-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-medium tracking-tight leading-snug">ASX RWA NFTs provide exposure to Real Estate Cashflow</h2>
                    <p className="mt-2 text-sm sm:text-base text-white/70 max-w-3xl leading-relaxed">A professionally structured, on-chain instrument offering pro-rata access to a targeted annual cash distribution sourced from net apartment rental operations - delivered via a secured loan &amp; promissory note framework.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-4 items-stretch">
                    <HeroStat label="Total ASX Distributed" value="13,195.58" image="/images/nft/B2.png" />
                    <HeroStat label="Distributions Made" value="8" image="/images/nft/Vinyl.png" />
                    <HeroStat label="Aggregate Supply" value="8,000" image="/images/nft/Garden.png" />
                    <div className="flex items-stretch"><LegalTile compact /></div>
                </div>
            </div>
        </section>
    );
}

function HeroStat({ label, value, image }: { label: string; value: ReactNode; image?: string }) {
    return (
        <div className={"relative rounded-lg border border-white/10 bg-white/[0.045] px-4 py-2 min-w-[150px] " + (image ? 'pr-16' : '')}>
            <div className="flex flex-col leading-tight gap-0.5">
                <span className="text-3xs uppercase tracking-wide text-white/55 font-medium">{label}</span>
                <span className="text-sm font-semibold text-white tabular-nums">{value}</span>
            </div>
            {image && (
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className="w-14 h-14 object-contain rounded-md shadow shadow-black/40" loading="lazy" />
                </div>
            )}
        </div>
    );
}

export default RwaHero;
