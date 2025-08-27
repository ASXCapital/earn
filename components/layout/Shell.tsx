"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { AnnouncementBar } from "./SiteAnnouncement";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState, useCallback } from "react";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const open = useCallback(() => setMobileOpen(true), []);
  const close = useCallback(() => setMobileOpen(false), []);
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <Sidebar variant="mobile" open={mobileOpen} onClose={close} />
      <div className="flex-1 flex flex-col">
        <AnnouncementBar />
        <Topbar onOpenSidebar={open} />
        <main className={clsx("px-6 md:px-8 lg:px-10 xl:px-12 py-6", pathname === "/" ? "" : "")}>{children}</main>
      </div>
    </div>
  );
}
