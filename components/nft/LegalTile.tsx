"use client";

import { useState, useEffect, useRef } from 'react';

interface BundleFiles { [bundle: string]: string[] }

// Hardcode bundles (public assets). If new files added, redeploy or enhance with API route.
const BUNDLES: BundleFiles = {
    ASXRWA001: [
        'LoanAgreement(BVILaw)ASXLimited (4).pdf',
        'PromissoryNote(BVILaw)ASXLimited (5).pdf',
        'PromissoryNoteGolemtoASX (4).pdf',
        'TermsandConditionsofUseforNFT (5).pdf'
    ],
    ASXRWA002: [
        'DraftdirectorwrittenresolutionsASX Limited-1486220-v3 (2).pdf',
        'LoanAgreement(BVILaw)ASXLimited (5).pdf',
        'PromissoryNote(BVILaw)ASXLimited-1485835-v3 (1).pdf',
        'PromissoryNote-GolemtoASX (1).pdf',
        'TermsandConditionsofUseforNFT (6).pdf'
    ]
};

export default function LegalTile() {
    const [bundle, setBundle] = useState<keyof typeof BUNDLES | ''>('');
    const [open, setOpen] = useState(false); // dropdown
    const [showDocs, setShowDocs] = useState(true); // collapse docs
    const menuRef = useRef<HTMLDivElement | null>(null);
    const files = bundle ? BUNDLES[bundle] : [];

    // Close on outside click
    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    // Keyboard ESC close
    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
        if (open) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    function choose(b: keyof typeof BUNDLES) {
        setBundle(b);
        setOpen(false);
        setShowDocs(true);
    }

    return (
        <div className="card p-4 flex flex-col gap-2 relative" ref={menuRef}>
            <div className="text-[11px] uppercase tracking-wide text-white/45 flex items-center justify-between">
                <span>Legal</span>
                {bundle && (
                    <button
                        onClick={() => setShowDocs(s => !s)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                        aria-label={showDocs ? 'Collapse documents' : 'Expand documents'}
                    >
                        {showDocs ? '−' : '+'}
                    </button>
                )}
            </div>
            <div className="flex flex-col gap-2">
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="group relative w-full text-left px-2 py-1.5 rounded-md bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] text-xs text-white/80 flex items-center justify-between gap-2 transition"
                    aria-haspopup="listbox"
                >
                    <span className="truncate">{bundle || 'Select Bundle'}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}> <polyline points="6 9 12 15 18 9" /> </svg>
                    {/* focus ring */}
                    <span className="pointer-events-none absolute inset-0 rounded-md ring-0 group-focus-visible:ring-2 ring-teal-400/60" />
                </button>
                {open && (
                    <div
                        role="listbox"
                        aria-label="Legal bundles"
                        className="absolute z-20 mt-1 w-[calc(100%-2rem)] left-4 bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-md shadow-lg p-1 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1"
                    >
                        {Object.keys(BUNDLES).map(b => {
                            const active = b === bundle;
                            return (
                                <button
                                    key={b}
                                    role="option"
                                    data-selected={active ? 'true' : 'false'}
                                    onClick={() => choose(b as keyof typeof BUNDLES)}
                                    className={`text-xs px-2 py-1 rounded-md text-left flex items-center justify-between gap-2 transition ${active ? 'bg-teal-500/20 text-teal-300' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                                >
                                    <span>{b}</span>
                                    {active && <svg width="10" height="10" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                                </button>
                            );
                        })}
                    </div>
                )}
                {bundle && showDocs && (
                    <ul className="flex flex-col gap-1 max-h-48 overflow-auto pr-1 rounded-md border border-white/10 bg-white/[0.03] divide-y divide-white/5">
                        {files.map(file => {
                            const b = (bundle as string).toLowerCase();
                            const path = `/legal/${b}/${encodeURIComponent(file)}`;
                            return (
                                <li key={file} className="first:pt-1 last:pb-1">
                                    <a
                                        href={path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-1 px-2 py-1 text-[11px] text-teal-300 hover:text-white hover:bg-white/5 rounded transition truncate"
                                    >
                                        <svg width="10" height="10" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 group-hover:opacity-100 flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>
                                        <span className="truncate" title={file}>{file}</span>
                                        <svg width="10" height="10" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-80 transition-opacity flex-shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                )}
                {bundle && !showDocs && (
                    <button
                        onClick={() => setShowDocs(true)}
                        className="text-[10px] self-start mt-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                    >Show documents</button>
                )}
            </div>
        </div>
    );
}
