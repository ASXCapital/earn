"use client";

import { ThirdwebProvider } from "thirdweb/react";
// The current thirdweb version's ThirdwebProvider no longer accepts client/supportedChains props directly.
// Those are configured via hooks when connecting. Keeping this wrapper for future additions.

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  );
}
