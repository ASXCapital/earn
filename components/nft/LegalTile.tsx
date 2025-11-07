"use client";

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Button } from '@/components/common/Button';
import { createPortal } from 'react-dom';

interface BundleFiles { [bundle: string]: string[] }

// Hardcode bundles (public assets). If new files added, redeploy or enhance with API route.
export const LEGAL_BUNDLES: BundleFiles = {
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

type FloatingPosition = {
    top: number;
    left: number;
    minWidth: number;
    align: 'left' | 'right';
};

export default function LegalTile({ compact = false, defaultBundle }: { compact?: boolean; defaultBundle?: keyof typeof LEGAL_BUNDLES }) {
    const [bundle, setBundle] = useState<keyof typeof LEGAL_BUNDLES | ''>(defaultBundle || '');
    const [open, setOpen] = useState(false); // bundle dropdown
    // If compact, keep docs collapsed by default and render them as overlay so height stays minimal
    const [showDocs, setShowDocs] = useState(false); // overlay hidden by default in hero
    const rootRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLDivElement | null>(null);
    const bundleListRef = useRef<HTMLDivElement | null>(null);
    const docsListRef = useRef<HTMLDivElement | null>(null);
    const [bundleDropdownPos, setBundleDropdownPos] = useState<FloatingPosition | null>(null);
    const [docsDropdownPos, setDocsDropdownPos] = useState<FloatingPosition | null>(null);
    const [menuId] = useState(() => `legal-menu-${Math.random().toString(36).slice(2, 9)}`);
    const [docsId] = useState(() => `legal-docs-${Math.random().toString(36).slice(2, 9)}`);
    const files = bundle ? LEGAL_BUNDLES[bundle] : [];

    // Close on outside click
    useEffect(() => {
        if (typeof document === 'undefined') return undefined;
        if (!open && !showDocs) return undefined;
        const handle = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (rootRef.current?.contains(target)) return;
            if (bundleListRef.current?.contains(target)) return;
            if (docsListRef.current?.contains(target)) return;
            setOpen(false);
            setShowDocs(false);
        };
        document.addEventListener('mousedown', handle);
        document.addEventListener('touchstart', handle);
        return () => {
            document.removeEventListener('mousedown', handle);
            document.removeEventListener('touchstart', handle);
        };
    }, [open, showDocs]);

    // Keyboard ESC close
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        if (!open && !showDocs) return undefined;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
                setShowDocs(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, showDocs]);

    useEffect(() => {
        if (defaultBundle && !bundle) {
            setBundle(defaultBundle);
        }
    }, [defaultBundle, bundle]);

    const portalTarget = typeof document !== 'undefined' ? document.body : null;

    const computeFloatingPosition = useCallback((offset = 6, widthFloor = 220): FloatingPosition | null => {
        if (!compact || !triggerRef.current || typeof window === 'undefined') return null;
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const margin = 12;
        const minWidth = Math.max(rect.width, widthFloor);
        const spaceToLeft = rect.right;
        const spaceToRight = viewportWidth - rect.left;
        const alignRight = spaceToLeft >= minWidth || spaceToLeft >= spaceToRight;
        if (alignRight) {
            const maxRight = viewportWidth - margin;
            return {
                top: rect.bottom + offset,
                left: Math.min(rect.right, maxRight),
                minWidth,
                align: 'right',
            };
        }
        const maxLeft = viewportWidth - minWidth - margin;
        return {
            top: rect.bottom + offset,
            left: Math.min(Math.max(rect.left, margin), Math.max(margin, maxLeft)),
            minWidth,
            align: 'left',
        };
    }, [compact]);

    const updateBundlePosition = useCallback(() => {
        const pos = computeFloatingPosition(6, 220);
        if (pos) setBundleDropdownPos(pos);
    }, [computeFloatingPosition]);

    const updateDocsPosition = useCallback(() => {
        const pos = computeFloatingPosition(10, 260);
        if (pos) setDocsDropdownPos(pos);
    }, [computeFloatingPosition]);

    useLayoutEffect(() => {
        if (!compact || !open) return;
        updateBundlePosition();
    }, [compact, open, updateBundlePosition]);

    useLayoutEffect(() => {
        if (!compact || !showDocs || !bundle) return;
        updateDocsPosition();
    }, [compact, showDocs, bundle, updateDocsPosition]);

    useEffect(() => {
        if (!compact) return;
        if (!open && !(showDocs && bundle)) return;
        if (typeof window === 'undefined') return;
        const handle = () => {
            if (open) updateBundlePosition();
            if (showDocs && bundle) updateDocsPosition();
        };
        window.addEventListener('resize', handle);
        window.addEventListener('scroll', handle, true);
        return () => {
            window.removeEventListener('resize', handle);
            window.removeEventListener('scroll', handle, true);
        };
    }, [compact, open, showDocs, bundle, updateBundlePosition, updateDocsPosition]);

    useEffect(() => {
        if (!open) setBundleDropdownPos(null);
    }, [open]);

    useEffect(() => {
        if (!showDocs || !bundle) {
            setDocsDropdownPos(null);
        }
    }, [showDocs, bundle]);

    function choose(b: keyof typeof LEGAL_BUNDLES) {
        setBundle(b);
        setOpen(false);
        setShowDocs(true);
    }

    const bundleItems = Object.keys(LEGAL_BUNDLES).map(b => {
        const active = b === bundle;
        return (
            <Button
                key={b}
                onClick={() => choose(b as keyof typeof LEGAL_BUNDLES)}
                size="sm"
                variant="ghost"
                role="option"
                aria-selected={active}
                className={`w-full px-2 py-1 text-left flex items-center justify-between gap-2 transition ${active ? 'bg-teal-500/25 text-teal-300' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
                <span className="truncate">{b}</span>
                {active && <svg width="10" height="10" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
            </Button>
        );
    });

    const docsList = files.map(file => {
        const b = (bundle as string).toLowerCase();
        const path = `/legal/${b}/${encodeURIComponent(file)}`;
        return (
            <li key={file} className="first:pt-1 last:pb-1">
                <a
                    href={path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-1 px-2 py-1 text-2xs text-teal-300 hover:text-white hover:bg-white/5 rounded-md transition truncate"
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 group-hover:opacity-100 flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>
                    <span className="truncate" title={file}>{file}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-80 transition-opacity flex-shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                </a>
            </li>
        );
    });

    const rootBase = compact
        // Compact: stretch to fill parent; parent already supplies border/background
        ? 'relative flex flex-col gap-1 w-full h-full px-3 py-2'
        : 'card p-4 flex flex-col gap-2 relative';

    return (
        <div className={rootBase} ref={rootRef}>
            <div className="text-3xs uppercase tracking-wide text-white/50 flex items-center justify-between">
                <span>Legal</span>
                {bundle && !compact && (
                    <Button
                        onClick={() => setShowDocs(s => !s)}
                        size="sm"
                        variant="ghost"
                        className="px-1.5 py-0.5 text-3xs bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                        aria-label={showDocs ? 'Collapse documents' : 'Expand documents'}
                    >
                        {showDocs ? 'Hide' : 'Show'}
                    </Button>
                )}
            </div>
            <div className="flex flex-col gap-1 relative" ref={triggerRef}>
                <Button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    size="sm"
                    variant="outline"
                    className={"group relative w-full text-left flex items-center justify-between gap-2 transition text-xs " + (compact
                        ? 'px-2 py-1 bg-white/[0.05] border-white/10 hover:bg-white/[0.08] text-white/70'
                        : 'px-2 py-1.5 bg-white/[0.04] border-white/10 hover:bg-white/[0.07] text-white/80')}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-controls={menuId}
                >
                    <span className="truncate">{bundle || 'Select Bundle'}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}> <polyline points="6 9 12 15 18 9" /> </svg>
                    <span className="pointer-events-none absolute inset-0 rounded-md ring-0 group-focus-visible:ring-2 ring-teal-400/60" />
                </Button>
                {!compact && open && (
                    <div
                        ref={bundleListRef}
                        id={menuId}
                        role="listbox"
                        className="absolute z-40 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#0c111a]/95 p-1 space-y-0.5 text-xs shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur"
                    >
                        {bundleItems}
                    </div>
                )}
                {compact && open && bundleDropdownPos && portalTarget && createPortal(
                    <div
                        ref={bundleListRef}
                        id={menuId}
                        role="listbox"
                        className="fixed pointer-events-auto z-[80] max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-[#0c111a]/95 p-1 space-y-0.5 text-2xs shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur"
                        style={{
                            top: bundleDropdownPos.top,
                            left: bundleDropdownPos.left,
                            minWidth: bundleDropdownPos.minWidth,
                            transform: bundleDropdownPos.align === 'right' ? 'translateX(-100%)' : undefined,
                        }}
                    >
                        {bundleItems}
                    </div>,
                    portalTarget,
                )}
                {!compact && bundle && showDocs && (
                    <div
                        ref={docsListRef}
                        id={docsId}
                        className="absolute z-50 top-full left-0 right-0 mt-2 rounded-lg border border-white/15 bg-[#0d1116]/95 p-3 text-2xs shadow-[0_22px_60px_rgba(0,0,0,0.55)] backdrop-blur-sm"
                        role="region"
                        aria-label="Legal documents"
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-3xs uppercase tracking-wide text-white/50">Documents ({files.length})</span>
                            <Button onClick={() => setShowDocs(false)} size="sm" variant="ghost" className="border border-white/10 bg-white/5 px-1 py-0.5 text-3xs text-white/60 hover:bg-white/10 hover:text-white">Close</Button>
                        </div>
                        <ul className="flex max-h-48 flex-col gap-1 overflow-auto pr-1 divide-y divide-white/5">
                            {docsList}
                        </ul>
                    </div>
                )}
                {compact && bundle && showDocs && docsDropdownPos && portalTarget && createPortal(
                    <div
                        ref={docsListRef}
                        id={docsId}
                        className="fixed pointer-events-auto z-[80] rounded-lg border border-white/15 bg-[#0d1116]/96 p-3 text-2xs shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur"
                        style={{
                            top: docsDropdownPos.top,
                            left: docsDropdownPos.left,
                            minWidth: Math.max(docsDropdownPos.minWidth, 240),
                            maxWidth: '90vw',
                            transform: docsDropdownPos.align === 'right' ? 'translateX(-100%)' : undefined,
                        }}
                        role="region"
                        aria-label="Legal documents"
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-3xs uppercase tracking-wide text-white/50">Documents ({files.length})</span>
                            <Button onClick={() => setShowDocs(false)} size="sm" variant="ghost" className="border border-white/10 bg-white/5 px-1 py-0.5 text-3xs text-white/60 hover:bg-white/10 hover:text-white">Close</Button>
                        </div>
                        <ul className="flex max-h-56 flex-col gap-1 overflow-auto pr-1 divide-y divide-white/5">
                            {docsList}
                        </ul>
                    </div>,
                    portalTarget,
                )}
                {compact && bundle && !showDocs && (
                    <Button
                        onClick={() => setShowDocs(true)}
                        size="sm"
                        variant="ghost"
                        className="absolute -top-2 right-0 border border-white/10 bg-white/5 px-1.5 py-0.5 text-3xs text-white/50 hover:bg-white/10 hover:text-white"
                        aria-controls={docsId}
                        aria-expanded={showDocs}
                        aria-label="Show documents"
                    >
                        Docs
                    </Button>
                )}
            </div>
        </div>
    );
}

