"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { ToastProvider } from "@/components/toast/ToastProvider";
// The current thirdweb version's ThirdwebProvider no longer accepts client/supportedChains props directly.
// Those are configured via hooks when connecting. Keeping this wrapper for future additions.

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThirdwebProvider>
  );
}
