"use client";
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/common/Button';

const STORAGE_KEY = 'asx_announcement_dismissed_v1';

export function AnnouncementBar() {
    const [open, setOpen] = useState(true);
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === '1') setOpen(false);
        } catch { }
    }, []);

    function dismiss() {
        setOpen(false);
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch { }
    }

    if (!open) return null;

    return (
        <div className={clsx(
            'relative z-40 w-full border-b border-amber-300/30 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20',
            'backdrop-blur-sm'
        )}>
            <div className="px-4 md:px-6 lg:px-8 py-2 text-2xs leading-relaxed flex items-start md:items-center gap-4 text-amber-100">
                <div className="flex-1">
                    <strong className="font-semibold tracking-wide text-amber-200">Security Notice:</strong>{' '}
                    Always verify you are on <span className="font-mono underline decoration-dotted">earn.asx.capital</span>. Welcome to the new earn ecosystem—expect rapid enhancements over the next weeks for a deeper experience. Feedback is welcome on X <a href="https://x.com/asx_capital" target="_blank" rel="noreferrer noopener" className="text-amber-200 hover:text-white font-semibold">@asx_capital</a>.
                </div>
                <Button
                    onClick={dismiss}
                    aria-label="Dismiss announcement"
                    size="sm"
                    variant="ghost"
                    className="shrink-0 px-2 py-0.5 text-3xs uppercase tracking-wider bg-amber-400/20 hover:bg-amber-400/30 text-amber-100 border border-amber-300/30 shadow-sm hover:text-white"
                >
                    Close
                </Button>
            </div>
        </div>
    );
}
