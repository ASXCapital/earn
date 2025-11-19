import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { formatUnits } from "viem";
import { getContract, NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { allowance, balanceOf } from "thirdweb/extensions/erc20";

import { client } from "@/lib/thirdweb";
import { MARKETPLACE_V3_CHAIN } from "@/marketplace/config";

export type CurrencyAllowanceState = {
  isNativeCurrency: boolean;
  balanceFormatted: string | null;
  loading: boolean;
  error: string | null;
  hasSufficientBalance: boolean;
  hasSufficientAllowance: boolean;
  needsApproval: boolean;
  refresh: () => void;
  currencyContract?: ReturnType<typeof getContract>;
  allowanceWei: bigint;
  balanceWei: bigint;
  checksFailed: boolean;
};

type UseCurrencyAllowanceProps = {
  currencyAddress?: Address;
  accountAddress?: Address;
  spenderAddress: Address;
  decimals?: number;
  requiredAmountWei: bigint;
};

const ZERO = 0n;

export function useCurrencyAllowance({
  currencyAddress,
  accountAddress,
  spenderAddress,
  decimals = 18,
  requiredAmountWei,
}: UseCurrencyAllowanceProps): CurrencyAllowanceState {
  const [allowanceWei, setAllowanceWei] = useState<bigint>(ZERO);
  const [balanceWei, setBalanceWei] = useState<bigint>(ZERO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const normalizedCurrency = currencyAddress?.toLowerCase();
  const nativeAddress = NATIVE_TOKEN_ADDRESS.toLowerCase();
  const isNativeCurrency =
    !currencyAddress || normalizedCurrency === nativeAddress;

  const currencyContract = useMemo(() => {
    if (isNativeCurrency || !currencyAddress) return undefined;
    return getContract({
      client,
      chain: MARKETPLACE_V3_CHAIN,
      address: currencyAddress,
    });
  }, [currencyAddress, isNativeCurrency]);

  useEffect(() => {
    if (!accountAddress || !currencyContract || isNativeCurrency) {
      setAllowanceWei(ZERO);
      setBalanceWei(ZERO);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [balance, currentAllowance] = await Promise.all([
          balanceOf({
            contract: currencyContract,
            address: accountAddress,
          }),
          allowance({
            contract: currencyContract,
            owner: accountAddress,
            spender: spenderAddress,
          }),
        ]);
        if (cancelled) return;
        setBalanceWei(balance ?? ZERO);
        setAllowanceWei(currentAllowance ?? ZERO);
      } catch (err) {
        if (cancelled) return;
        setBalanceWei(ZERO);
        setAllowanceWei(ZERO);
        setError(
          err instanceof Error ? err.message : "Unable to read ERC20 allowance.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    accountAddress,
    currencyContract,
    isNativeCurrency,
    refreshIndex,
    spenderAddress,
  ]);

  const balanceFormatted = useMemo(() => {
    if (isNativeCurrency) return null;
    try {
      return formatUnits(balanceWei, decimals);
    } catch {
      return null;
    }
  }, [balanceWei, decimals, isNativeCurrency]);

  const hasSufficientAllowance =
    isNativeCurrency || allowanceWei >= requiredAmountWei;
  const hasSufficientBalance =
    isNativeCurrency || balanceWei >= requiredAmountWei;

  return {
    currencyContract,
    allowanceWei,
    balanceWei,
    isNativeCurrency,
    balanceFormatted,
    loading,
    error,
    hasSufficientAllowance,
    hasSufficientBalance,
    needsApproval: !hasSufficientAllowance,
    refresh: () => setRefreshIndex((index) => index + 1),
    checksFailed: Boolean(error),
  };
}
