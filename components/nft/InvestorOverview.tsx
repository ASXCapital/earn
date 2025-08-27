"use client";

import { useState } from 'react';

export default function InvestorOverview() {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-md border border-white/10 bg-white/5">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-[13px] font-medium tracking-wide text-white/80 hover:text-white hover:bg-white/10 transition"
            >
                <span>Investor Overview</span>
                <svg
                    width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform ${open ? 'rotate-180' : ''}`}
                ><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            {open && (
                <div className="px-4 pb-4 pt-2 text-[11px] leading-relaxed space-y-5 max-h-[480px] overflow-auto investor-scroll">
                    <section>
                        <h3 className="text-[12px] font-semibold text-teal-300 mb-2">ASX MVA NFT – Investor Overview</h3>
                    </section>
                    <section className="space-y-2">
                        <h4 className="font-semibold text-white/80 text-[11px] flex items-center gap-1">Financial Highlights <span className="text-white/40">(YE 2024 vs YE 2023)</span></h4>
                        <div className="overflow-auto rounded border border-white/10 bg-white/[0.03]">
                            <table className="w-full text-[11px] min-w-[420px]">
                                <thead className="bg-white/5 text-white/60">
                                    <tr>
                                        <th className="px-2 py-1 text-left font-medium">Metric</th>
                                        <th className="px-2 py-1 text-left font-medium">YE 2024</th>
                                        <th className="px-2 py-1 text-left font-medium">YE 2023</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {([
                                        ['Total Property Revenue', '104.53%', '100.00%'],
                                        ['Operating Expenses', '57.40%', '52.64%'],
                                        ['Net Operating Income', '47.13%', '47.36%'],
                                        ['Capital Replacements', '6.26%', '11.95%'],
                                        ['Available for Debt Service', '28.44%', '23.04%'],
                                        ['Debt Service', '10.61%', '11.02%'],
                                        ['Net Cash Flow', '17.84%', '12.02%', 'highlight'],
                                    ] as const).map(r => (
                                        <tr key={r[0] as string} className={r[3] ? 'font-semibold text-white' : ''}>
                                            <td className="px-2 py-1 whitespace-nowrap text-white/70">{r[0]}</td>
                                            <td className="px-2 py-1">{r[1]}</td>
                                            <td className="px-2 py-1">{r[2]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <SectionTitle title="Yield Mechanics (Sample)" />
                    <List items={[
                        'Mint: $50,000',
                        'Admin Fee: 10% ($5,000)',
                        'Net Loan to ASX: $45,000',
                        'GC Annualized Loan Payment: $4,725',
                        'NFT Holder Yield (after fees): ~8.50% (Performance as of 6/30/25 – not guaranteed)'
                    ]} />
                    <SectionTitle title="Upside Potential (Hypothetical Example)" />
                    <List items={[
                        'GC → ASX Upside Payment: $75,000',
                        'Less Admin Fee (flat): $2,500',
                        'Net Upside to NFT Holders: $72,500',
                        'NFT Holder Multiple: 1.45x (Upside could be higher or lower, not guaranteed)'
                    ]} />
                    <SectionTitle title="Mint Phases" />
                    <List items={[
                        'Partner Phase → No limit (pre-agreed mints)',
                        'Limited Lord / ASXRWA001 Holder Round → Max 5 NFTs/wallet',
                        'Whitelist Phase → Max 5 NFTs/wallet',
                        'Unlimited Lord / ASXRWA001 Holder Round → No cap',
                        'Public Phase → Open mint'
                    ]} />
                    <SectionTitle title="Key Features" />
                    <List items={[
                        'Profit-Linked Yield: 2.78% + Upside 1.20%',
                        'Regular loan payments from Golem Capital via AssetXChain',
                        'Transparent Admin Fee (10%)',
                        'NFT Structure: Tokenized promissory note with direct cash flow'
                    ]} />
                    <SectionTitle title="Backed by Real Assets" />
                    <List items={[
                        'Investments in FJC Apartments',
                        'Loans: ASX Limited (BVI) → AssetXChain LLC → Golem Capital',
                        'Payments flow to holders (minus admin fee + upside fee)'
                    ]} />
                    <SectionTitle title="Legal & Compliance" />
                    <List items={[
                        'Issued by ASX Limited (BVI Reg. No. 2137221)',
                        'Governed by BVI law',
                        'Backed by Loan Agreements & Promissory Notes',
                        'Holders receive pro-rata profit share'
                    ]} />
                    <SectionTitle title="Disclaimers" />
                    <List items={[
                        'Past performance not indicative of future returns',
                        'Upside examples are hypothetical only',
                        'NFTs are not securities; risk of total loss exists',
                        'Restricted jurisdictions apply'
                    ]} />
                    <div className="pt-2 border-t border-white/10 text-center text-[11px] space-y-1">
                        <div className="font-semibold text-white/90">ASX FJC NFT = Real Estate-Linked Yield + Tokenized Upside</div>
                        <div className="text-white/50">info@asx.capital &nbsp;|&nbsp; asx.capital</div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SectionTitle({ title }: { title: string }) {
    return <h4 className="font-semibold text-white/80 text-[11px]">{title}</h4>;
}

function List({ items }: { items: string[] }) {
    return (
        <ul className="list-disc ml-4 space-y-1 text-white/70">
            {items.map(i => <li key={i}>{i}</li>)}
        </ul>
    );
}