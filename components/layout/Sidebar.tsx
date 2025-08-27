"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import clsx from "clsx";
import { BookText, Boxes, Coins, LayoutDashboard, Layers3, X } from "lucide-react";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/rwa", label: "NFT/RWA", icon: Layers3 },
  { href: "/staking", label: "Staking", icon: Coins },
  { href: "/ecosystem", label: "Ecosystem", icon: Boxes },
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
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring focus:ring-cyan-500"
          >
            <X size={18} />
          </button>
        )}
      </div>
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
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
          <button
            aria-label="Close menu backdrop"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={onClose}
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
