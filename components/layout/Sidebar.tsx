"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import clsx from "clsx";
import { BookText, Boxes, Coins, LayoutDashboard, Layers3 } from "lucide-react";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/rwa", label: "NFT/RWA", icon: Layers3 },
  { href: "/staking", label: "Staking", icon: Coins },
  { href: "/ecosystem", label: "Ecosystem", icon: Boxes },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-[240px] bg-[color:var(--bg-soft)] border-r border-white/5">
      <div className="h-16 px-5 flex items-center">
        <Link href="/" className="flex items-center">
          <Image src="/asx_white_square1200_transparent.png" alt="ASX" width={40} height={40} className="rounded-md" />
          <span className="sr-only">ASX</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          // Root path should match exactly "/"; other links treat nested paths as active
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx("nav-item", active && "nav-item-active")}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/5">
        <Link href="/docs" className="nav-item">
          <BookText size={18} />
          <span>Docs</span>
        </Link>
      </div>
    </aside>
  );
}
