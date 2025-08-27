"use client";
import { useState } from 'react';

export default function InvestorOverviewFJC() {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-md border border-white/10 bg-white/5">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-[13px] font-medium tracking-wide text-white/80 hover:text-white hover:bg-white/10 transition"
            >
                <span>Investor Overview</span>
                <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            {open && (
                <div className="px-4 pb-4 pt-2 text-[11px] leading-relaxed space-y-5 max-h-[480px] overflow-auto">
                    <section>
                        <h3 className="text-[12px] font-semibold text-teal-300 mb-2">ASX FJC NFT – Investor Overview</h3>
                        <p className="text-white/60">Summary derived from accompanying Promissory Notes & Terms and Conditions documents provided in bundle ASXRWA001.</p>
                    </section>
                    <Section title="Structure" bullets={[
                        'NFT represents a tokenized promissory note issued by ASX Limited (BVI).',
                        'Loan proceeds onward lent to project entity (FJC Apartments) via structured chain of agreements.',
                        'Cash flows (interest + potential upside) flow back to holders net of admin fee.'
                    ]} />
                    <Section title="Economic Terms" bullets={[
                        'Admin Fee: 10% (deducted upfront and/or on upside events per Terms).',
                        'Core yield component sourced from scheduled loan payments.',
                        'Upside participation triggered upon defined capital events (see Promissory Note).'
                    ]} />
                    <Section title="Cash Flow Mechanics" bullets={[
                        'Borrower makes periodic payments to AssetXChain LLC / ASX Limited per loan schedules.',
                        'Admin fee retained; net distributions allocated pro‑rata to NFT holders.',
                        'Reporting and documentation accessible through posted PDF legal set in the Legal tile.'
                    ]} />
                    <Section title="Risk Factors (Non-Exhaustive)" bullets={[
                        'Performance risk of underlying FJC real estate operations.',
                        'Counterparty/credit risk on borrower and intermediaries.',
                        'Regulatory treatment of tokenized promissory notes could evolve.',
                        'Market/secondary liquidity not guaranteed.',
                        'Potential total loss; no assurance of upside event.'
                    ]} />
                    <Section title="Key Documents Referenced" bullets={[
                        'Promissory Note (Golem to ASX).',
                        'Terms and Conditions of Use for NFT.',
                        'Loan Agreement (ASX Limited to AssetXChain).',
                        'Director Resolutions / Corporate Authorizations.'
                    ]} />
                    <Section title="Holder Benefits" bullets={[
                        'Direct exposure to real-estate linked income stream.',
                        'Programmable ownership representation (on-chain proof).',
                        'Potential upside participation beyond baseline yield.',
                        'Transparent fee structure (fixed admin component).'
                    ]} />
                    <Section title="Disclaimers" bullets={[
                        'Not investment advice; NFTs not classified as securities in issuing framework.',
                        'Historical or sample yields are illustrative only; not guaranteed.',
                        'Jurisdictional restrictions may apply; ensure compliance.',
                        'Always review full legal PDFs before making decisions.'
                    ]} />
                    <div className="pt-2 border-t border-white/10 text-center text-[11px] space-y-1">
                        <div className="font-semibold text-white/90">ASX FJC NFT – Tokenized Real Estate Cash Flow + Potential Upside</div>
                        <div className="text-white/50">info@asx.capital &nbsp;|&nbsp; asx.capital</div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Section({ title, bullets }: { title: string; bullets: string[] }) {
    return (
        <section className="space-y-2">
            <h4 className="font-semibold text-white/80 text-[11px]">{title}</h4>
            <ul className="list-disc ml-4 space-y-1 text-white/70">
                {bullets.map(b => <li key={b}>{b}</li>)}
            </ul>
        </section>
    );
}