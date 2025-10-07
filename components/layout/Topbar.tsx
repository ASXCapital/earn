"use client";

import { ConnectButton, darkTheme } from "thirdweb/react";
import { Menu } from "lucide-react";
import { createWallet } from "thirdweb/wallets";
import { client, supportedChains } from "@/lib/thirdweb";
import { Button } from "@/components/common/Button";

// Keep original simple wallet list
const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("io.rabby"),
  createWallet("com.okex.wallet"),
  createWallet("global.safe"),
];

interface TopbarProps { onOpenSidebar?: () => void; }

export function Topbar({ onOpenSidebar }: TopbarProps) {
  return (
    <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={onOpenSidebar}
          size="icon"
          variant="ghost"
          className="md:hidden focus:outline-none focus:ring focus:ring-cyan-500"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </Button>
      </div>
      <div className="flex items-center gap-3">

        <div className="tw-connect-wrapper">
          <ConnectButton
            client={client}
            wallets={wallets}
            chains={supportedChains as any}
            connectModal={{
              showThirdwebBranding: false,
              size: "wide",
              termsOfServiceUrl: "https://asx-1.gitbook.io/asx-docs/general/terms-and-conditions",
              titleIcon: "https://3286441079-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FbWVWPjMvoUOjCBOf5SgG%2Fuploads%2Fhg0FbqIZO5VH3bBu9nI0%2Fasx_white_square500_transparent.png?alt=media&token=a781d370-9e24-4147-9cd5-9e8301632a9d",
            } as any}
            theme={darkTheme({
              colors: { accentText: "hsl(179, 100%, 60%)" },
            })}
          />
        </div>
      </div>
    </div>
  );
}
