import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { hasRole } from "thirdweb/extensions/permissions";

import { MARKETPLACE_CONTRACT } from "@/components/marketplace/constants";

type AdminState = {
  isAdmin: boolean;
  isCheckingAdmin: boolean;
  adminCheckError: string | null;
  verifyAdmin: () => Promise<void>;
};

export function useMarketplaceAdmin(accountAddress?: Address): AdminState {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [adminCheckError, setAdminCheckError] = useState<string | null>(null);

  const verifyAdmin = useCallback(async () => {
    if (!accountAddress) {
      setIsAdmin(false);
      setAdminCheckError(null);
      setIsCheckingAdmin(false);
      return;
    }
    setIsCheckingAdmin(true);
    setAdminCheckError(null);
    try {
      const hasAdminRole = await hasRole({
        contract: MARKETPLACE_CONTRACT,
        role: "admin",
        targetAccountAddress: accountAddress as Address,
      });
      setIsAdmin(hasAdminRole);
    } catch (err) {
      console.warn("Unable to verify admin role", err);
      setIsAdmin(false);
      setAdminCheckError(err instanceof Error ? err.message : "Unable to verify admin status.");
    } finally {
      setIsCheckingAdmin(false);
    }
  }, [accountAddress]);

  useEffect(() => {
    verifyAdmin();
  }, [verifyAdmin]);

  return {
    isAdmin,
    isCheckingAdmin,
    adminCheckError,
    verifyAdmin,
  };
}
