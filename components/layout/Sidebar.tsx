"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import clsx from "clsx";
import { BookText, Boxes, Coins, LayoutDashboard, Layers3, Sparkles, Store, X } from "lucide-react";
import { Button } from "@/components/common/Button";

const PRIMARY_NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/rwa", label: "NFT/RWA", icon: Layers3 },
  { href: "/staking", label: "Staking", icon: Coins },
  { href: "/ecosystem", label: "Ecosystem", icon: Boxes },
];

const COMING_NAV = [
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/rwa-defi", label: "RWA DeFi", icon: Sparkles },
];

interface SidebarProps {
  variant?: 'desktop' | 'mobile';
  open?: boolean; // mobile only
  onClose?: () => void; // mobile only
}

export function Sidebar({ variant = 'desktop', open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const content = (
    <>
      <div className="h-16 px-5 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/asx_white_square1200_transparent.png" alt="ASX" width={40} height={40} className="rounded-md" />
          <span className="sr-only">ASX</span>
        </Link>
        {variant === 'mobile' && (
          <Button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            size="icon"
            variant="ghost"
            className="focus:outline-none focus:ring focus:ring-cyan-500"
          >
            <X size={18} />
          </Button>
        )}
      </div>
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx("nav-item", active && "nav-item-active")}
              onClick={onClose}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <div className="pt-3">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-3 shadow-[0_20px_60px_-40px_rgba(20,180,180,0.35)]">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-white/55">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300/80 shadow-[0_0_14px_rgba(251,191,36,0.65)]" />
              Coming Late Jan
            </div>
            <div className="mt-2 space-y-1">
              {COMING_NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "nav-item text-[12px] px-2.5 py-2 text-white/75",
                      active && "nav-item-active",
                    )}
                    onClick={onClose}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
      <div className="px-3 py-4 border-t border-white/5">
        <Link href="/docs" className="nav-item" onClick={onClose}>
          <BookText size={18} />
          <span>Docs</span>
        </Link>
      </div>
    </>
  );

  if (variant === 'mobile') {
    // Mobile drawer
    return (
      <>
        <aside
          className={clsx(
            'md:hidden fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col bg-[color:var(--bg-soft)] border-r border-white/5 transform transition-transform duration-200',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {content}
        </aside>
        {/* Backdrop */}
        {open && (
          <Button
            aria-label="Close menu backdrop"
            onClick={onClose}
            variant="ghost"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden rounded-none p-0"
          />
        )}
      </>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-[240px] bg-[color:var(--bg-soft)] border-r border-white/5">
      {content}
    </aside>
  );
}
