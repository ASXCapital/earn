"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/toast/ToastProvider";
import { usePrices } from "@/hooks/usePrices";
import { STAKING_POOLS } from "@/data/staking";
import { TOKENS } from "@/data/tokens";
import { useActiveAccount, useActiveWallet, useActiveWalletChain } from "thirdweb/react";
import { bsc, client } from "@/lib/thirdweb";
import { PCS_V2_ROUTER, addLiquidity, getAmountsOut, removeLiquidity, swapExactTokensForTokens } from "@/lib/pancake";
import {
  approveErc20,
  claimRewards,
  getErc20Allowance,
  getErc20Balance,
  getErc20Decimals,
  getErc20Symbol,
  getClaimableRewards,
  getRewardTokens,
  getStakedBalance,
  getStakingContract,
  stakeTokens,
  withdrawTokens,
  type StakingContractType,
} from "@/lib/staking";

const LP_POOLS = STAKING_POOLS.filter(
  (pool) => pool.tokens.length > 1 && pool.chain === "bsc" && (pool as any).rwaDefi,
);

type Pool = (typeof STAKING_POOLS)[number];

const DEFAULT_SLIPPAGE_OPTIONS = ["0.1", "0.5", "1", "2"] as const;
const ASX_SELL_SLIPPAGE_OPTIONS = ["2", "3.1", "3.5", "4"] as const;

type DepositToken = { symbol: string; address?: string; isNative?: boolean };
type StepStatus = "idle" | "pending" | "done" | "error";
type ZapStep = { id: string; label: string; status: StepStatus; txHash?: string };
type ZapMode = "fusion" | "instant";
type WithdrawAction = "reverse" | "reverse-all" | "claim";
type WalletAssetBalance = {
  symbol: string;
  address: string;
  decimals: number;
  balance: bigint;
  label?: string;
};

const FUSION_POLL_INTERVAL_MS = 3000;
const FUSION_MAX_WAIT_MS = 90_000;
const FUSION_PENDING_STATUSES = new Set(["pending", "partially-filled"]);
const FUSION_FAILURE_STATUSES = new Set([
  "false-predicate",
  "not-enough-balance-or-allowance",
  "expired",
  "wrong-permit",
  "cancelled",
  "invalid-signature",
]);
const ONE_INCH_LIMIT_ORDER_ABI = [
  "function cancelOrders(uint256[] makerTraits,bytes32[] orderHashes)",
];

const BSC_TOKENS = TOKENS.filter((token) => token.chain === "bsc");
const TOKEN_ADDRESS: Record<string, string> = Object.fromEntries(
  BSC_TOKENS.map((token) => [token.symbol, token.address]),
);
const SYMBOL_BY_ADDRESS: Record<string, string> = Object.fromEntries(
  BSC_TOKENS.map((token) => [token.address.toLowerCase(), token.symbol]),
);
const WBNB_ADDRESS = TOKEN_ADDRESS.WBNB;
const ASX_ADDRESS = TOKEN_ADDRESS.ASX;
const AUTO_FUSION_SLIPPAGE = "1";
const AUTO_INSTANT_SLIPPAGE = "2";
const AUTO_TAXED_FUSION_SLIPPAGE = "3.1";
const AUTO_TAXED_INSTANT_SLIPPAGE = "3.5";
const addressForSymbol = (symbol?: string) => {
  if (!symbol) return undefined;
  if (symbol === "BNB") return WBNB_ADDRESS;
  return TOKEN_ADDRESS[symbol];
};

const DEPOSIT_TOKENS: DepositToken[] = [
  { symbol: "ASX", address: addressForSymbol("ASX") },
  { symbol: "USDC", address: addressForSymbol("USDC") },
];
function formatAmount(value: number | null, symbol?: string) {
  if (!value || !Number.isFinite(value)) return "--";
  const formatted = value.toLocaleString(undefined, { maximumFractionDigits: 6 });
  return symbol ? `${formatted} ${symbol}` : formatted;
}

function formatUSD(value: number | null) {
  if (!value || !Number.isFinite(value)) return "--";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function shortAddress(value?: string, chars = 4) {
  if (!value) return "--";
  return value.slice(0, 2 + chars) + "…" + value.slice(-chars);
}

function parseUnitsSafe(value: string, decimals: number): bigint {
  if (!value) return 0n;
  const [i, f = ""] = value.split(".");
  const frac = (f.padEnd(decimals, "0")).slice(0, decimals);
  const intPart = BigInt(i || "0");
  const fracPart = BigInt(frac || "0");
  return intPart * 10n ** BigInt(decimals) + fracPart;
}

function toBigIntValue(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isFinite(value)) return BigInt(Math.trunc(value));
  if (typeof value === "string" && value.trim()) {
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  }
  if (Array.isArray(value) && value.length > 0) {
    return toBigIntValue(value[0]);
  }
  return 0n;
}

function applySlippage(amount: bigint, slippagePct: number) {
  const bps = Math.round(slippagePct * 100);
  const keep = Math.max(0, 10_000 - bps);
  return (amount * BigInt(keep)) / 10_000n;
}

function normalizeErrorMessage(payload: any, fallback: string) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload?.description === "string" && payload.description) return payload.description;
  if (typeof payload?.error === "string" && payload.error) return payload.error;
  return fallback;
}

async function parseApiJson(res: Response) {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { error: raw };
  }
}

function formatFusionStatus(status?: string | null) {
  if (!status) return "pending";
  return status.replace(/-/g, " ");
}

function formatUnitsPlain(value: bigint, decimals: number, maxFraction = 6) {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(Math.max(0, decimals));
  const intPart = abs / base;
  const fracPart = abs % base;
  let output = intPart.toString();
  if (maxFraction > 0 && fracPart > 0n) {
    const frac = fracPart
      .toString()
      .padStart(decimals, "0")
      .slice(0, maxFraction)
      .replace(/0+$/, "");
    if (frac) output += `.${frac}`;
  }
  return negative ? `-${output}` : output;
}

function formatUnitsDisplay(value: bigint, decimals: number, maxFraction = 6) {
  const plain = formatUnitsPlain(value, decimals, maxFraction);
  const negative = plain.startsWith("-");
  const unsigned = negative ? plain.slice(1) : plain;
  const [intPart, fracPart] = unsigned.split(".");
  const withGrouping = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${withGrouping}${fracPart ? `.${fracPart}` : ""}`;
}

function toApproxNumber(value: bigint, decimals: number) {
  const n = Number(formatUnitsPlain(value, decimals, 8));
  return Number.isFinite(n) ? n : 0;
}

function parseClaimableTotal(value: any): bigint {
  if (typeof value === "bigint") return value;
  if (Array.isArray(value)) {
    return value.reduce((acc, item) => {
      if (typeof item === "bigint") return acc + item;
      if (Array.isArray(item) && item.length > 1) return acc + toBigIntValue(item[1]);
      if (item && typeof item === "object") return acc + toBigIntValue((item as any).amount ?? (item as any)[1]);
      return acc;
    }, 0n);
  }
  if (value && typeof value === "object") {
    return toBigIntValue((value as any).amount ?? (value as any)[1] ?? 0n);
  }
  return toBigIntValue(value);
}

export function ZapTest() {
  const { pushToast } = useToast();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const activeChain = useActiveWalletChain();
  const defaultPool = LP_POOLS[0];
  const [poolKey, setPoolKey] = useState<string>(defaultPool?.key ?? "");
  const pool = useMemo(
    () => LP_POOLS.find((item) => item.key === poolKey) ?? defaultPool,
    [poolKey, defaultPool],
  ) as Pool | undefined;

  const [fromToken, setFromToken] = useState<string>(DEPOSIT_TOKENS[0]?.symbol ?? "ASX");
  const [zapMode, setZapMode] = useState<ZapMode>("fusion");
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<string>("3.5");
  const [processing, setProcessing] = useState(false);
  const [steps, setSteps] = useState<ZapStep[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fusionOrderHash, setFusionOrderHash] = useState<string | null>(null);
  const [fusionStatus, setFusionStatus] = useState<string | null>(null);
  const [fusionChecking, setFusionChecking] = useState(false);
  const [fusionCancelling, setFusionCancelling] = useState(false);
  const [walletAssets, setWalletAssets] = useState<WalletAssetBalance[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [stakedLpBalance, setStakedLpBalance] = useState<bigint>(0n);
  const [lpWalletBalance, setLpWalletBalance] = useState<bigint>(0n);
  const [lpTokenDecimals, setLpTokenDecimals] = useState(18);
  const [lpTokenSymbol, setLpTokenSymbol] = useState("LP");
  const [claimableRewardsBalance, setClaimableRewardsBalance] = useState<bigint>(0n);
  const [rewardTokenDecimals, setRewardTokenDecimals] = useState(18);
  const [rewardTokenSymbol, setRewardTokenSymbol] = useState("ASX");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAction, setWithdrawAction] = useState<WithdrawAction | null>(null);
  const [autoOptimizing, setAutoOptimizing] = useState(false);
  const prices = usePrices();

  const depositMeta = useMemo(
    () => DEPOSIT_TOKENS.find((token) => token.symbol === fromToken),
    [fromToken],
  );

  const missingDepositAddress = Boolean(!depositMeta?.isNative && !depositMeta?.address);

  const amountNum = Number(amount);
  const half = Number.isFinite(amountNum) && amountNum > 0 ? amountNum / 2 : null;
  const poolTokens = ((pool?.tokens as readonly string[] | undefined) ?? []) as string[];
  const tokenA = poolTokens[0];
  const tokenB = poolTokens[1];
  const isPoolToken = poolTokens.includes(fromToken);
  const swapTo = isPoolToken ? poolTokens.find((token) => token !== fromToken) ?? poolTokens[0] : poolTokens[0];

  const priceFor = (symbol?: string) => {
    if (!symbol) return null;
    const s = symbol.toUpperCase();
    if (s === "ASX") return prices?.asxBsc ?? null;
    if (s === "BNB") return prices?.bnb ?? null;
    if (s === "ETH") return prices?.eth ?? null;
    if (s === "BTCB") return prices?.btcb ?? null;
    if (s === "SOL") return prices?.sol ?? null;
    if (s === "USDC") return 1;
    if (s === "XAUM") return (prices as any)?.xaum ?? null;
    return null;
  };

  const asxPrice = priceFor("ASX");
  const depositPrice = priceFor(fromToken);
  const tokenAPrice = priceFor(tokenA);
  const tokenBPrice = priceFor(tokenB);
  const totalUsd = depositPrice && amountNum > 0 ? amountNum * depositPrice : null;
  const halfUsd = totalUsd ? totalUsd / 2 : null;
  const tokenAOut = tokenAPrice && halfUsd ? halfUsd / tokenAPrice : null;
  const tokenBOut = tokenBPrice && halfUsd ? halfUsd / tokenBPrice : null;
  const tokenAUsd = tokenAOut && tokenAPrice ? tokenAOut * tokenAPrice : null;
  const tokenBUsd = tokenBOut && tokenBPrice ? tokenBOut * tokenBPrice : null;
  const totalUsdOut = tokenAUsd != null && tokenBUsd != null ? tokenAUsd + tokenBUsd : null;
  const asxEquivalent = totalUsdOut && asxPrice ? totalUsdOut / asxPrice : null;
  const isFusionMode = zapMode === "fusion";
  const swapLabel = isFusionMode ? "1inch Fusion swap" : "PCS v2 swap";

  const poolAddress = pool?.address;
  const poolType = (pool as any)?.contractType as StakingContractType | undefined;
  const selectedPoolType = poolType || "stakingRewards";
  const lpToken = (pool as any)?.lpToken as string | undefined;
  const tokenAAddress = addressForSymbol(tokenA);
  const tokenBAddress = addressForSymbol(tokenB);
  const expectedChainId = 56;
  const networkMismatch = !!account?.address && activeChain?.id !== expectedChainId;
  const canStart =
    !!pool &&
    !!poolAddress &&
    !!fromToken &&
    amountNum > 0 &&
    !missingDepositAddress &&
    !!account?.address &&
    !networkMismatch;
  const addLiquidityStepIndex = isPoolToken ? 2 : 3;
  const stakeStepIndex = isPoolToken ? 3 : 4;
  const stakedLpDisplay = formatUnitsDisplay(stakedLpBalance, lpTokenDecimals, 6);
  const lpWalletDisplay = formatUnitsDisplay(lpWalletBalance, lpTokenDecimals, 6);
  const claimableRewardsDisplay = formatUnitsDisplay(claimableRewardsBalance, rewardTokenDecimals, 6);
  const canWithdrawAmount =
    !!account?.address &&
    !networkMismatch &&
    !withdrawAction &&
    parseUnitsSafe(withdrawAmount || "0", lpTokenDecimals) > 0n &&
    stakedLpBalance > 0n;
  const canWithdrawAll =
    !!account?.address &&
    !networkMismatch &&
    !withdrawAction &&
    stakedLpBalance > 0n;
  const canClaimRewards =
    !!account?.address &&
    !networkMismatch &&
    !withdrawAction &&
    claimableRewardsBalance > 0n;
  const walletAssetRows = walletAssets.map((asset) => {
    const symbolForPrice = asset.symbol === "WBNB" ? "BNB" : asset.symbol;
    const price = priceFor(symbolForPrice);
    const amountNum = toApproxNumber(asset.balance, asset.decimals);
    const usdValue = price ? amountNum * price : null;
    return { ...asset, usdValue };
  });
  const selectedDepositAsset = walletAssets.find(
    (asset) => !!depositMeta?.address && asset.address.toLowerCase() === depositMeta.address.toLowerCase(),
  );
  const selectedDepositBalanceDisplay = selectedDepositAsset
    ? `${formatUnitsDisplay(selectedDepositAsset.balance, selectedDepositAsset.decimals, 6)} ${fromToken}`
    : "--";
  const isAsxDeposit = fromToken === "ASX";
  const slippageOptions = isAsxDeposit ? ASX_SELL_SLIPPAGE_OPTIONS : DEFAULT_SLIPPAGE_OPTIONS;

  const setStepStatus = (id: string, status: StepStatus, txHash?: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, status, txHash: txHash ?? step.txHash } : step)),
    );
  };

  const refreshFusionStatus = async () => {
    if (!fusionOrderHash) return;
    setFusionChecking(true);
    try {
      const resp = await fetch(`/api/1inch/fusion/status?orderHash=${encodeURIComponent(fusionOrderHash)}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = await parseApiJson(resp);
      if (!resp.ok) {
        throw new Error(normalizeErrorMessage(payload, "Fusion status check failed."));
      }
      const status = String((payload as any)?.status || "").toLowerCase() || null;
      setFusionStatus(status);
      pushToast({
        variant: "success",
        title: "Fusion status updated",
        description: status ? formatFusionStatus(status) : "pending",
      });
    } catch (e: any) {
      const msg = e?.message || "Fusion status check failed.";
      setErrorMsg(msg);
      pushToast({ variant: "error", title: "Status check failed", description: msg });
    } finally {
      setFusionChecking(false);
    }
  };

  const refreshPortfolio = useCallback(async () => {
    if (!account?.address) {
      setWalletAssets([]);
      setStakedLpBalance(0n);
      setLpWalletBalance(0n);
      setLpTokenDecimals(18);
      setLpTokenSymbol("LP");
      setClaimableRewardsBalance(0n);
      setRewardTokenDecimals(18);
      setRewardTokenSymbol("ASX");
      return;
    }

    setPortfolioLoading(true);
    try {
      const baseAssets: WalletAssetBalance[] = BSC_TOKENS.map((token) => ({
        symbol: token.symbol,
        address: token.address,
        decimals: 18,
        balance: 0n,
      }));
      const extraAssets: WalletAssetBalance[] = lpToken
        ? [
            {
              symbol: "LP",
              address: lpToken,
              decimals: 18,
              balance: 0n,
              label: `${tokenA || "Token A"}/${tokenB || "Token B"} LP`,
            },
          ]
        : [];

      const uniqueAssets = Array.from(
        new Map([...baseAssets, ...extraAssets].map((asset) => [asset.address.toLowerCase(), asset])).values(),
      );
      const loadedAssets = await Promise.all(
        uniqueAssets.map(async (asset) => {
          const [decimalsRaw, balanceRaw] = await Promise.all([
            getErc20Decimals(asset.address, "bsc").catch(() => 18),
            getErc20Balance(asset.address, account.address, "bsc").catch(() => 0n),
          ]);
          return {
            ...asset,
            decimals: Number(decimalsRaw) || 18,
            balance: toBigIntValue(balanceRaw),
          } as WalletAssetBalance;
        }),
      );
      loadedAssets.sort((a, b) => {
        if (a.balance === 0n && b.balance > 0n) return 1;
        if (b.balance === 0n && a.balance > 0n) return -1;
        return a.symbol.localeCompare(b.symbol);
      });
      setWalletAssets(loadedAssets);

      if (lpToken) {
        const lpFromList = loadedAssets.find((asset) => asset.address.toLowerCase() === lpToken.toLowerCase());
        const lpDecimals = lpFromList?.decimals ?? (await getErc20Decimals(lpToken, "bsc").catch(() => 18));
        const lpSymbol = await getErc20Symbol(lpToken, "bsc").catch(() => lpFromList?.label || "LP");
        const lpBalance = lpFromList?.balance ?? toBigIntValue(await getErc20Balance(lpToken, account.address, "bsc").catch(() => 0n));
        setLpTokenDecimals(Number(lpDecimals) || 18);
        setLpTokenSymbol(String(lpSymbol || lpFromList?.label || "LP"));
        setLpWalletBalance(lpBalance);
      } else {
        setLpTokenDecimals(18);
        setLpTokenSymbol("LP");
        setLpWalletBalance(0n);
      }

      if (poolAddress) {
        const stakingContract = getStakingContract(poolAddress, "bsc", selectedPoolType);
        const [stakedRaw, claimableRaw, rewardTokensRaw] = await Promise.all([
          getStakedBalance(stakingContract, account.address, selectedPoolType).catch(() => 0n),
          getClaimableRewards(stakingContract, account.address, selectedPoolType).catch(() => 0n),
          getRewardTokens(stakingContract, selectedPoolType).catch(() => [] as string[]),
        ]);

        const rewardTokenAddress = Array.isArray(rewardTokensRaw) && rewardTokensRaw.length
          ? String(rewardTokensRaw[0])
          : undefined;
        if (rewardTokenAddress) {
          const [rewardDecRaw, rewardSymRaw] = await Promise.all([
            getErc20Decimals(rewardTokenAddress, "bsc").catch(() => 18),
            getErc20Symbol(rewardTokenAddress, "bsc").catch(() => "REWARD"),
          ]);
          setRewardTokenDecimals(Number(rewardDecRaw) || 18);
          setRewardTokenSymbol(String(rewardSymRaw || "REWARD"));
        } else {
          setRewardTokenDecimals(18);
          setRewardTokenSymbol("ASX");
        }

        setStakedLpBalance(toBigIntValue(stakedRaw));
        setClaimableRewardsBalance(parseClaimableTotal(claimableRaw));
      } else {
        setStakedLpBalance(0n);
        setClaimableRewardsBalance(0n);
      }
    } catch (e: any) {
      const msg = e?.message || "Failed to load wallet balances.";
      setErrorMsg(msg);
    } finally {
      setPortfolioLoading(false);
    }
  }, [account?.address, lpToken, poolAddress, selectedPoolType, tokenA, tokenB]);

  useEffect(() => {
    setWithdrawAmount("");
  }, [poolKey]);

  useEffect(() => {
    const options = isAsxDeposit ? ASX_SELL_SLIPPAGE_OPTIONS : DEFAULT_SLIPPAGE_OPTIONS;
    if (!options.some((opt) => opt === slippage)) {
      setSlippage(isAsxDeposit ? "3.5" : "0.5");
    }
  }, [isAsxDeposit, slippage]);

  useEffect(() => {
    void refreshPortfolio();
  }, [refreshPortfolio]);

  const withdrawStake = async (action: WithdrawAction) => {
    if (!account?.address) {
      setErrorMsg("Connect your wallet to continue.");
      return;
    }
    if (!poolAddress) {
      setErrorMsg("Select a pool.");
      return;
    }
    if (networkMismatch) {
      try {
        await wallet?.switchChain(bsc as any);
      } catch {
        setErrorMsg("Switch to BNB Smart Chain to continue.");
        return;
      }
    }

    setWithdrawAction(action);
    setErrorMsg(null);
    try {
      const stakingContract = getStakingContract(poolAddress, "bsc", selectedPoolType);

      if (action === "claim") {
        const txClaim: any = await claimRewards(stakingContract, account, selectedPoolType);
        const txHash = txClaim?.transactionHash || txClaim?.hash;
        pushToast({
          variant: "success",
          title: "Rewards claimed",
          description: txHash ? shortAddress(txHash, 6) : "Claim transaction submitted.",
        });
        await refreshPortfolio();
        return;
      }

      if (!lpToken) throw new Error("LP token address missing.");
      if (!tokenAAddress || !tokenBAddress) throw new Error("Pool token addresses missing.");
      if (!ASX_ADDRESS) throw new Error("ASX token address missing.");

      const requestedAmount = action === "reverse-all"
        ? stakedLpBalance
        : parseUnitsSafe(withdrawAmount, lpTokenDecimals);
      if (requestedAmount <= 0n) throw new Error("Enter a valid LP amount to reverse.");
      if (requestedAmount > stakedLpBalance) throw new Error("Withdraw amount exceeds staked LP balance.");

      const slippagePct = Number(slippage || "0");
      const asxLower = ASX_ADDRESS.toLowerCase();
      const tokenALower = tokenAAddress.toLowerCase();
      const tokenBLower = tokenBAddress.toLowerCase();

      const withdrawSteps: ZapStep[] = [
        { id: "withdraw-unstake", label: "Unstake LP", status: "idle" },
        { id: "withdraw-approve-router", label: "Approve LP router", status: "idle" },
        { id: "withdraw-remove-liquidity", label: "Remove liquidity", status: "idle" },
      ];
      if (tokenALower !== asxLower) {
        withdrawSteps.push({ id: "withdraw-swap-a", label: `Swap ${tokenA} → ASX`, status: "idle" });
      }
      if (tokenBLower !== asxLower) {
        withdrawSteps.push({ id: "withdraw-swap-b", label: `Swap ${tokenB} → ASX`, status: "idle" });
      }
      setSteps(withdrawSteps);

      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const waitForBalanceIncrease = async (tokenAddr: string, before: bigint) => {
        for (let i = 0; i < 20; i += 1) {
          await sleep(2000);
          const now = toBigIntValue(await getErc20Balance(tokenAddr, account.address, "bsc"));
          if (now > before) return now;
        }
        return toBigIntValue(await getErc20Balance(tokenAddr, account.address, "bsc"));
      };

      const ensureAllowance = async (token: string, spender: string, amountNeeded: bigint, stepId?: string) => {
        if (stepId) setStepStatus(stepId, "pending");
        const allowanceRaw = await getErc20Allowance(token, account.address, spender, "bsc").catch(() => 0n);
        const allowance = toBigIntValue(allowanceRaw);
        if (allowance >= amountNeeded) {
          if (stepId) setStepStatus(stepId, "done");
          return;
        }
        const txApprove: any = await approveErc20(token, spender, 2n ** 255n, "bsc", account);
        if (stepId) setStepStatus(stepId, "done", txApprove?.transactionHash || txApprove?.hash);
      };

      const performSwapToAsx = async (fromTokenAddr: string, amountIn: bigint, stepId: string) => {
        if (amountIn <= 0n) {
          setStepStatus(stepId, "done");
          return 0n;
        }
        if (fromTokenAddr.toLowerCase() === asxLower) {
          setStepStatus(stepId, "done");
          return amountIn;
        }

        setStepStatus(stepId, "pending");
        await ensureAllowance(fromTokenAddr, PCS_V2_ROUTER, amountIn);
        const asxBefore = toBigIntValue(await getErc20Balance(ASX_ADDRESS, account.address, "bsc"));

        const paths: string[][] = [[fromTokenAddr, ASX_ADDRESS]];
        if (WBNB_ADDRESS && fromTokenAddr !== WBNB_ADDRESS && ASX_ADDRESS !== WBNB_ADDRESS) {
          paths.push([fromTokenAddr, WBNB_ADDRESS, ASX_ADDRESS]);
        }

        let bestPath: string[] | null = null;
        let expectedOut = 0n;
        for (const path of paths) {
          try {
            const amounts: any = await getAmountsOut(amountIn, path);
            const out = toBigIntValue(amounts?.[amounts.length - 1]);
            if (out > expectedOut) {
              expectedOut = out;
              bestPath = path;
            }
          } catch {}
        }
        if (!bestPath || expectedOut <= 0n) {
          throw new Error(`No PCS route found for ${SYMBOL_BY_ADDRESS[fromTokenAddr.toLowerCase()] || "token"} → ASX.`);
        }

        const minOut = applySlippage(expectedOut, slippagePct);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
        const txSwap: any = await swapExactTokensForTokens({
          amountIn,
          amountOutMin: minOut,
          path: bestPath,
          to: account.address,
          deadline,
          account,
        });
        setStepStatus(stepId, "done", txSwap?.transactionHash || txSwap?.hash);

        const asxAfter = await waitForBalanceIncrease(ASX_ADDRESS, asxBefore);
        const gained = asxAfter > asxBefore ? asxAfter - asxBefore : 0n;
        if (gained <= 0n) {
          throw new Error(`ASX output not detected for ${SYMBOL_BY_ADDRESS[fromTokenAddr.toLowerCase()] || "swap"}.`);
        }
        return gained;
      };

      setStepStatus("withdraw-unstake", "pending");
      const txWithdraw: any = await withdrawTokens(stakingContract, requestedAmount, account, selectedPoolType);
      setStepStatus("withdraw-unstake", "done", txWithdraw?.transactionHash || txWithdraw?.hash);

      await ensureAllowance(lpToken, PCS_V2_ROUTER, requestedAmount, "withdraw-approve-router");

      const tokenABefore = toBigIntValue(await getErc20Balance(tokenAAddress, account.address, "bsc"));
      const tokenBBefore = toBigIntValue(await getErc20Balance(tokenBAddress, account.address, "bsc"));
      const asxBeforeAll = toBigIntValue(await getErc20Balance(ASX_ADDRESS, account.address, "bsc"));

      let removeTokenA = tokenAAddress;
      let removeTokenB = tokenBAddress;
      if (removeTokenA.toLowerCase() > removeTokenB.toLowerCase()) {
        removeTokenA = tokenBAddress;
        removeTokenB = tokenAAddress;
      }

      setStepStatus("withdraw-remove-liquidity", "pending");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
      const txRemove: any = await removeLiquidity({
        tokenA: removeTokenA,
        tokenB: removeTokenB,
        liquidity: requestedAmount,
        amountAMin: 0n,
        amountBMin: 0n,
        to: account.address,
        deadline,
        account,
      });
      setStepStatus("withdraw-remove-liquidity", "done", txRemove?.transactionHash || txRemove?.hash);

      const tokenAAfter = await waitForBalanceIncrease(tokenAAddress, tokenABefore);
      const tokenBAfter = await waitForBalanceIncrease(tokenBAddress, tokenBBefore);
      const tokenAReceived = tokenAAfter > tokenABefore ? tokenAAfter - tokenABefore : 0n;
      const tokenBReceived = tokenBAfter > tokenBBefore ? tokenBAfter - tokenBBefore : 0n;
      if (tokenAReceived <= 0n && tokenBReceived <= 0n) {
        throw new Error("No tokens received from LP removal.");
      }

      if (tokenALower !== asxLower) {
        await performSwapToAsx(tokenAAddress, tokenAReceived, "withdraw-swap-a");
      }
      if (tokenBLower !== asxLower) {
        await performSwapToAsx(tokenBAddress, tokenBReceived, "withdraw-swap-b");
      }

      const asxAfterAll = toBigIntValue(await getErc20Balance(ASX_ADDRESS, account.address, "bsc"));
      const asxGained = asxAfterAll > asxBeforeAll ? asxAfterAll - asxBeforeAll : 0n;
      const asxDecimals = await getErc20Decimals(ASX_ADDRESS, "bsc").catch(() => 18);

      if (action !== "reverse-all") setWithdrawAmount("");
      await refreshPortfolio();
      pushToast({
        variant: "success",
        title: "Reverse withdraw complete",
        description:
          asxGained > 0n
            ? `${formatUnitsDisplay(asxGained, Number(asxDecimals) || 18, 6)} ASX received.`
            : "LP removed and swaps submitted.",
      });
    } catch (e: any) {
      const msg = e?.message || "Withdraw failed.";
      setErrorMsg(msg);
      setSteps((prev) => prev.map((step) => (step.status === "pending" ? { ...step, status: "error" } : step)));
      pushToast({ variant: "error", title: "Withdraw failed", description: msg });
    } finally {
      setWithdrawAction(null);
    }
  };

  const autoOptimizeExecution = async () => {
    if (!account?.address) {
      setErrorMsg("Connect your wallet to continue.");
      return;
    }
    if (!pool || !poolAddress) {
      setErrorMsg("Select a pool.");
      return;
    }
    if (!tokenAAddress || !tokenBAddress || !depositMeta?.address) {
      setErrorMsg("Pool token addresses missing.");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Enter an amount first.");
      return;
    }

    setAutoOptimizing(true);
    setErrorMsg(null);
    try {
      const fromAddress = depositMeta.address;
      const decimalsFrom = await getErc20Decimals(fromAddress, "bsc");
      const amountWei = parseUnitsSafe(amount, decimalsFrom);
      if (amountWei <= 0n) throw new Error("Amount must be greater than 0.");
      const amountSplit1 = amountWei / 2n;
      const amountSplit2 = amountWei - amountSplit1;
      if (amountSplit1 <= 0n || amountSplit2 <= 0n) {
        throw new Error("Amount too small.");
      }

      const legs: Array<{ from: string; to: string; amount: bigint }> = poolTokens.includes(fromToken)
        ? (() => {
            const targetSymbol = poolTokens.find((token) => token !== fromToken) ?? poolTokens[0];
            const targetAddress = addressForSymbol(targetSymbol);
            if (!targetAddress) throw new Error("Swap target address missing.");
            return [{ from: fromAddress, to: targetAddress, amount: amountSplit1 }];
          })()
        : [
            { from: fromAddress, to: tokenAAddress, amount: amountSplit1 },
            { from: fromAddress, to: tokenBAddress, amount: amountSplit2 },
          ];

      const quoteInstantOut = async (fromTokenAddr: string, toTokenAddr: string, amt: bigint) => {
        const paths: string[][] = [[fromTokenAddr, toTokenAddr]];
        if (WBNB_ADDRESS && fromTokenAddr !== WBNB_ADDRESS && toTokenAddr !== WBNB_ADDRESS) {
          paths.push([fromTokenAddr, WBNB_ADDRESS, toTokenAddr]);
        }
        let best = 0n;
        for (const path of paths) {
          try {
            const amounts: any = await getAmountsOut(amt, path);
            const out = toBigIntValue(amounts?.[amounts.length - 1]);
            if (out > best) best = out;
          } catch {}
        }
        return best;
      };

      const quoteFusionOut = async (fromTokenAddr: string, toTokenAddr: string, amt: bigint) => {
        const resp = await fetch("/api/1inch/fusion/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromTokenAddress: fromTokenAddr,
            toTokenAddress: toTokenAddr,
            amount: amt.toString(),
            walletAddress: account.address,
          }),
        });
        const payload = await parseApiJson(resp);
        if (!resp.ok) {
          throw new Error(normalizeErrorMessage(payload, "Fusion quote failed."));
        }
        return toBigIntValue((payload as any)?.toTokenAmount ?? 0n);
      };

      const tokenDecimals = new Map<string, number>();
      const readDecimals = async (address: string) => {
        const key = address.toLowerCase();
        if (tokenDecimals.has(key)) return tokenDecimals.get(key)!;
        const dec = await getErc20Decimals(address, "bsc").catch(() => 18);
        tokenDecimals.set(key, dec);
        return dec;
      };

      let instantScore = 0;
      let fusionScore = 0;
      let instantQuotedLegs = 0;
      let fusionQuotedLegs = 0;

      for (const leg of legs) {
        const [instantRes, fusionRes, toDecimals] = await Promise.all([
          quoteInstantOut(leg.from, leg.to, leg.amount).catch(() => 0n),
          quoteFusionOut(leg.from, leg.to, leg.amount).catch(() => 0n),
          readDecimals(leg.to),
        ]);

        const targetSymbol = SYMBOL_BY_ADDRESS[leg.to.toLowerCase()];
        const targetPrice = priceFor(targetSymbol);
        const instantOut = toBigIntValue(instantRes);
        const fusionOut = toBigIntValue(fusionRes);
        if (instantOut > 0n) instantQuotedLegs += 1;
        if (fusionOut > 0n) fusionQuotedLegs += 1;

        const instantAmount = toApproxNumber(instantOut, toDecimals);
        const fusionAmount = toApproxNumber(fusionOut, toDecimals);
        if (targetPrice && Number.isFinite(targetPrice)) {
          instantScore += instantAmount * targetPrice;
          fusionScore += fusionAmount * targetPrice;
        } else {
          instantScore += instantAmount;
          fusionScore += fusionAmount;
        }
      }

      const taxableInput = fromAddress.toLowerCase() === TOKEN_ADDRESS.ASX?.toLowerCase();
      let recommendedMode: ZapMode;
      if (fusionQuotedLegs > 0 && instantQuotedLegs > 0) {
        if (fusionScore > instantScore * 1.003) recommendedMode = "fusion";
        else if (instantScore > fusionScore * 1.003) recommendedMode = "instant";
        else recommendedMode = taxableInput ? "fusion" : "instant";
      } else if (fusionQuotedLegs > 0) {
        recommendedMode = "fusion";
      } else if (instantQuotedLegs > 0) {
        recommendedMode = "instant";
      } else {
        recommendedMode = taxableInput ? "fusion" : "instant";
      }

      const recommendedSlippage =
        taxableInput
          ? (recommendedMode === "fusion" ? AUTO_TAXED_FUSION_SLIPPAGE : AUTO_TAXED_INSTANT_SLIPPAGE)
          : (recommendedMode === "fusion" ? AUTO_FUSION_SLIPPAGE : AUTO_INSTANT_SLIPPAGE);

      setZapMode(recommendedMode);
      setSlippage(recommendedSlippage);

      const instantLabel = instantQuotedLegs > 0 ? formatUSD(instantScore) : "n/a";
      const fusionLabel = fusionQuotedLegs > 0 ? formatUSD(fusionScore) : "n/a";
      pushToast({
        variant: "success",
        title: "Auto settings applied",
        description: `Mode: ${recommendedMode === "fusion" ? "Fusion" : "Instant"}, slippage: ${recommendedSlippage}% (Instant ${instantLabel} vs Fusion ${fusionLabel}).`,
      });
    } catch (e: any) {
      const msg = e?.message || "Auto optimize failed.";
      setErrorMsg(msg);
      pushToast({ variant: "error", title: "Auto optimize failed", description: msg });
    } finally {
      setAutoOptimizing(false);
    }
  };

  const cancelPendingFusionOrders = async () => {
    if (!account?.address) {
      setErrorMsg("Connect your wallet to continue.");
      return;
    }
    if (networkMismatch) {
      try {
        await wallet?.switchChain(bsc as any);
      } catch {
        setErrorMsg("Switch to BNB Smart Chain to continue.");
        return;
      }
    }

    setFusionCancelling(true);
    setErrorMsg(null);

    try {
      const resp = await fetch("/api/1inch/fusion/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: account.address }),
      });
      const payload = await parseApiJson(resp);
      if (!resp.ok) {
        throw new Error(normalizeErrorMessage(payload, "Fusion cancel lookup failed."));
      }

      const contractAddress = String((payload as any)?.contractAddress || "");
      if (!contractAddress) throw new Error("Fusion cancel contract missing.");

      const orderHashes = Array.isArray((payload as any)?.orderHashes)
        ? (payload as any).orderHashes.filter((item: unknown) => typeof item === "string")
        : [];
      const makerTraitsRaw = Array.isArray((payload as any)?.makerTraits)
        ? (payload as any).makerTraits
        : [];

      if (!orderHashes.length) {
        pushToast({
          variant: "success",
          title: "No pending Fusion orders",
          description: "This wallet has no pending or partially-filled Fusion orders.",
        });
        return;
      }

      if (makerTraitsRaw.length !== orderHashes.length) {
        throw new Error("Fusion cancel payload mismatch.");
      }

      const makerTraits = makerTraitsRaw.map((value: unknown) => {
        try {
          return BigInt(String(value));
        } catch {
          throw new Error("Fusion makerTraits payload invalid.");
        }
      });

      const cancelContract = getContract({
        address: contractAddress,
        abi: ONE_INCH_LIMIT_ORDER_ABI as any,
        client,
        chain: bsc,
      });
      const tx = prepareContractCall({
        contract: cancelContract,
        method: ONE_INCH_LIMIT_ORDER_ABI[0],
        params: [makerTraits, orderHashes],
      } as any);
      const sent: any = await sendTransaction({ transaction: tx, account });
      const txHash = sent?.transactionHash || sent?.hash;

      if (fusionOrderHash && orderHashes.some((hash: string) => hash.toLowerCase() === fusionOrderHash.toLowerCase())) {
        setFusionOrderHash(null);
      }
      setFusionStatus("cancelled");
      pushToast({
        variant: "success",
        title: "Fusion cancel submitted",
        description: `${orderHashes.length} pending order${orderHashes.length === 1 ? "" : "s"} cancelled${txHash ? ` (${shortAddress(txHash, 6)})` : ""}.`,
      });
    } catch (e: any) {
      const msg = e?.message || "Fusion cancel failed.";
      setErrorMsg(msg);
      pushToast({ variant: "error", title: "Fusion cancel failed", description: msg });
    } finally {
      setFusionCancelling(false);
    }
  };

  const startZap = async () => {
    setErrorMsg(null);
    setFusionOrderHash(null);
    setFusionStatus(null);
    if (!account?.address) {
      setErrorMsg("Connect your wallet to start.");
      return;
    }
    if (!pool || !poolAddress) {
      setErrorMsg("Select a pool.");
      return;
    }
    if (networkMismatch) {
      try {
        await wallet?.switchChain(bsc as any);
      } catch {
        setErrorMsg("Switch to BNB Smart Chain to continue.");
        return;
      }
    }
    if (!tokenAAddress || !tokenBAddress) {
      setErrorMsg("Pool token addresses missing.");
      return;
    }
    if (!depositMeta?.address) {
      setErrorMsg("Deposit token address missing.");
      return;
    }

    const stepList: ZapStep[] = [
      {
        id: "approve-swap",
        label: isFusionMode ? "Approve 1inch settlement" : "Approve PCS router for swap",
        status: "idle",
      },
      { id: "swap", label: isFusionMode ? "1inch Fusion swap (private)" : "PCS v2 swap (public)", status: "idle" },
      { id: "approve-router", label: "Approve PCS router for LP", status: "idle" },
      { id: "add-liquidity", label: "Add liquidity", status: "idle" },
      { id: "approve-stake", label: "Approve staking", status: "idle" },
      { id: "stake", label: "Stake LP", status: "idle" },
    ];
    setSteps(stepList);
    setProcessing(true);

    try {
      const fromAddress = depositMeta.address;
      const slippagePct = Number(slippage || "0");
      const decimalsFrom = await getErc20Decimals(fromAddress, "bsc");
      const amountWei = parseUnitsSafe(amount, decimalsFrom);
      if (amountWei <= 0n) throw new Error("Amount must be greater than 0.");
      const amountSplit1 = amountWei / 2n;
      const amountSplit2 = amountWei - amountSplit1;
      if (amountSplit1 <= 0n || amountSplit2 <= 0n) {
        throw new Error("Amount too small.");
      }
      const walletBalance = toBigIntValue(await getErc20Balance(fromAddress, account.address, "bsc"));
      if (walletBalance < amountWei) {
        throw new Error("Insufficient balance.");
      }

      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const waitForBalanceIncrease = async (tokenAddr: string, before: bigint) => {
        for (let i = 0; i < 20; i += 1) {
          await sleep(2000);
          const now = toBigIntValue(await getErc20Balance(tokenAddr, account.address, "bsc"));
          if (now > before) return now;
        }
        return before;
      };

      const ensureAllowance = async (params: {
        token: string;
        spender: string;
        amount: bigint;
        stepId: string;
        markStep?: boolean;
      }) => {
        const { token, spender, amount: needed, stepId, markStep = true } = params;
        if (markStep) setStepStatus(stepId, "pending");
        const allowanceRaw: any = await getErc20Allowance(token, account.address, spender, "bsc").catch(() => 0n);
        const allowance = toBigIntValue(allowanceRaw);
        if (allowance < needed) {
          const txApprove: any = await approveErc20(token, spender, 2n ** 255n, "bsc", account);
          if (markStep) setStepStatus(stepId, "done", txApprove?.transactionHash || txApprove?.hash);
          return;
        }
        if (markStep) setStepStatus(stepId, "done");
      };

      const performPublicSwap = async (
        fromTokenAddr: string,
        toTokenAddr: string,
        amt: bigint,
        _markApprovalStep?: boolean,
      ) => {
        if (amt <= 0n) return { received: 0n };
        const balanceBefore = toBigIntValue(await getErc20Balance(toTokenAddr, account.address, "bsc"));
        setStepStatus("swap", "pending");
        const paths: string[][] = [[fromTokenAddr, toTokenAddr]];
        if (WBNB_ADDRESS && fromTokenAddr !== WBNB_ADDRESS && toTokenAddr !== WBNB_ADDRESS) {
          paths.push([fromTokenAddr, WBNB_ADDRESS, toTokenAddr]);
        }
        let bestPath: string[] | null = null;
        let expectedOut = 0n;
        for (const path of paths) {
          try {
            const amounts: any = await getAmountsOut(amt, path);
            const out = BigInt(amounts?.[amounts.length - 1] ?? 0);
            if (out > expectedOut) {
              expectedOut = out;
              bestPath = path;
            }
          } catch {}
        }
        if (!bestPath || expectedOut <= 0n) throw new Error("No PCS route found.");
        const minOut = applySlippage(expectedOut, slippagePct);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
        const tx: any = await swapExactTokensForTokens({
          amountIn: amt,
          amountOutMin: minOut,
          path: bestPath,
          to: account.address,
          deadline,
          account,
        });
        setStepStatus("swap", "done", tx?.transactionHash || tx?.hash);
        const balanceAfter = await waitForBalanceIncrease(toTokenAddr, balanceBefore);
        const received = balanceAfter > balanceBefore ? balanceAfter - balanceBefore : 0n;
        if (received <= 0n) throw new Error("Swap output not detected.");
        return { received };
      };

      const fetchFusionStatus = async (orderHash: string) => {
        const resp = await fetch(`/api/1inch/fusion/status?orderHash=${encodeURIComponent(orderHash)}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = await parseApiJson(resp);
        if (!resp.ok) {
          throw new Error(normalizeErrorMessage(payload, "Fusion status request failed."));
        }
        return payload as any;
      };

      const waitForFusionFill = async (orderHash: string) => {
        const startedAt = Date.now();
        let latest: any = null;
        while (Date.now() - startedAt < FUSION_MAX_WAIT_MS) {
          latest = await fetchFusionStatus(orderHash);
          const status = String(latest?.status || "").toLowerCase();
          setFusionStatus(status || "pending");
          if (status === "filled") return { kind: "filled" as const, data: latest };
          if (FUSION_FAILURE_STATUSES.has(status)) return { kind: "failed" as const, data: latest };
          if (!FUSION_PENDING_STATUSES.has(status)) return { kind: "failed" as const, data: latest };
          await sleep(FUSION_POLL_INTERVAL_MS);
        }
        return { kind: "timeout" as const, data: latest };
      };

      const signFusionOrder = async (typedData: any) => {
        const provider: any =
          ((wallet as any)?.getProvider ? await (wallet as any).getProvider() : null) ||
          (globalThis as any)?.ethereum;
        if (!provider?.request) {
          throw new Error("Wallet provider does not support typed-data signing.");
        }
        const attempts = [
          { method: "eth_signTypedData_v4", params: [account.address, JSON.stringify(typedData)] },
          { method: "eth_signTypedData_v4", params: [account.address, typedData] },
          { method: "eth_signTypedData", params: [account.address, typedData] },
        ];
        let lastError: unknown = null;
        for (const call of attempts) {
          try {
            const signature = await provider.request(call as any);
            if (typeof signature === "string" && signature.startsWith("0x")) {
              return signature;
            }
          } catch (e) {
            lastError = e;
          }
        }
        throw new Error((lastError as any)?.message || "Failed to sign Fusion order.");
      };

      const performFusionSwap = async (
        fromTokenAddr: string,
        toTokenAddr: string,
        amt: bigint,
        markApprovalStep: boolean,
      ) => {
        if (amt <= 0n) return { received: 0n };
        setStepStatus("swap", "pending");
        const balanceBefore = toBigIntValue(await getErc20Balance(toTokenAddr, account.address, "bsc"));

        const prepareResp = await fetch("/api/1inch/fusion/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromTokenAddress: fromTokenAddr,
            toTokenAddress: toTokenAddr,
            amount: amt.toString(),
            walletAddress: account.address,
            slippage: Number(slippagePct.toFixed(2)),
          }),
        });
        const preparePayload = await parseApiJson(prepareResp);
        if (!prepareResp.ok) {
          throw new Error(normalizeErrorMessage(preparePayload, "Fusion prepare failed."));
        }

        const order = (preparePayload as any)?.order;
        const typedData = (preparePayload as any)?.typedData;
        const extension = (preparePayload as any)?.extension;
        const quoteId = (preparePayload as any)?.quoteId;
        const preparedOrderHash = (preparePayload as any)?.orderHash;
        const settlementAddress = (preparePayload as any)?.settlementAddress;
        if (!order || !typedData || !extension || !quoteId || !settlementAddress) {
          throw new Error("Fusion prepare response incomplete.");
        }

        if (markApprovalStep) {
          await ensureAllowance({
            token: fromTokenAddr,
            spender: settlementAddress,
            amount: amt,
            stepId: "approve-swap",
            markStep: true,
          });
        }

        const signature = await signFusionOrder(typedData);

        const submitResp = await fetch("/api/1inch/fusion/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order,
            signature,
            quoteId,
            extension,
          }),
        });
        const submitPayload = await parseApiJson(submitResp);
        if (!submitResp.ok) {
          throw new Error(normalizeErrorMessage(submitPayload, "Fusion submit failed."));
        }

        const orderHash = String((submitPayload as any)?.orderHash || preparedOrderHash || "");
        if (!orderHash) {
          throw new Error("Fusion submit succeeded but order hash is missing.");
        }
        setFusionOrderHash(orderHash);
        setFusionStatus("pending");

        const terminal = await waitForFusionFill(orderHash);
        const finalStatus = String(terminal?.data?.status || "").toLowerCase();
        if (terminal.kind === "timeout") {
          throw new Error(
            "Fusion order is still pending. It may fill later until expiry. Keep waiting or switch to Instant mode.",
          );
        }
        if (terminal.kind !== "filled") {
          throw new Error(`Fusion swap failed: ${formatFusionStatus(finalStatus)}.`);
        }

        const fills = Array.isArray(terminal?.data?.fills) ? terminal.data.fills : [];
        const fillTx = fills.length ? fills[fills.length - 1]?.txHash : undefined;
        setStepStatus("swap", "done", fillTx || orderHash);

        const balanceAfter = await waitForBalanceIncrease(toTokenAddr, balanceBefore);
        const received = balanceAfter > balanceBefore ? balanceAfter - balanceBefore : 0n;
        if (received <= 0n) throw new Error("Fusion filled but output token not detected.");
        return { received };
      };

      const ensureRouterApprovals = async (entries: Array<{ token: string; amount: bigint }>) => {
        setStepStatus("approve-router", "pending");
        let lastTxHash: string | undefined;
        for (const entry of entries) {
          if (!entry.token) continue;
          const allowanceRaw: any = await getErc20Allowance(
            entry.token,
            account.address,
            PCS_V2_ROUTER,
            "bsc",
          ).catch(() => 0n);
          const allowance = toBigIntValue(allowanceRaw);
          if (allowance < entry.amount) {
            const txApprove: any = await approveErc20(entry.token, PCS_V2_ROUTER, 2n ** 255n, "bsc", account);
            lastTxHash = txApprove?.transactionHash || txApprove?.hash || lastTxHash;
          }
        }
        setStepStatus("approve-router", "done", lastTxHash);
      };

      const performSwap = isFusionMode ? performFusionSwap : performPublicSwap;

      let amountA = 0n;
      let amountB = 0n;

      if (!isFusionMode) {
        await ensureAllowance({
          token: fromAddress,
          spender: PCS_V2_ROUTER,
          amount: amountWei,
          stepId: "approve-swap",
          markStep: true,
        });
      }

      if (poolTokens.includes(fromToken)) {
        const swapTarget = poolTokens.find((token) => token !== fromToken) ?? poolTokens[0];
        const swapTargetAddr = addressForSymbol(swapTarget);
        if (!swapTargetAddr) throw new Error("Swap target address missing.");
        const swapRes = await performSwap(fromAddress, swapTargetAddr, amountSplit1, true);
        const keepAmount = amountSplit2;
        if (fromToken === tokenA) {
          amountA = keepAmount;
          amountB = swapRes.received;
        } else {
          amountA = swapRes.received;
          amountB = keepAmount;
        }
      } else {
        const swapA = await performSwap(fromAddress, tokenAAddress, amountSplit1, true);
        const swapB = await performSwap(fromAddress, tokenBAddress, amountSplit2, false);
        amountA = swapA.received;
        amountB = swapB.received;
      }

      await ensureRouterApprovals([
        { token: tokenAAddress, amount: amountA },
        { token: tokenBAddress, amount: amountB },
      ]);

      const minA = applySlippage(amountA, slippagePct);
      const minB = applySlippage(amountB, slippagePct);
      if (amountA <= 0n || amountB <= 0n) {
        throw new Error("Swap output too low.");
      }

      // Canonicalize token order (token0/token1) so wallet simulations compute pool ratio correctly.
      let liqTokenA = tokenAAddress;
      let liqTokenB = tokenBAddress;
      let liqAmountA = amountA;
      let liqAmountB = amountB;
      let liqMinA = minA;
      let liqMinB = minB;
      if (liqTokenA.toLowerCase() > liqTokenB.toLowerCase()) {
        liqTokenA = tokenBAddress;
        liqTokenB = tokenAAddress;
        liqAmountA = amountB;
        liqAmountB = amountA;
        liqMinA = minB;
        liqMinB = minA;
      }

      const lpAddress = lpToken || "";
      const lpBefore = lpAddress ? toBigIntValue(await getErc20Balance(lpAddress, account.address, "bsc")) : 0n;

      setStepStatus("add-liquidity", "pending");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
      let txLiquidity: any;
      try {
        txLiquidity = await addLiquidity({
          tokenA: liqTokenA,
          tokenB: liqTokenB,
          amountADesired: liqAmountA,
          amountBDesired: liqAmountB,
          amountAMin: liqMinA,
          amountBMin: liqMinB,
          to: account.address,
          deadline,
          account,
        });
      } catch (liqErr: any) {
        const liqMsg = String(liqErr?.message || "").toLowerCase();
        const shouldRetryRelaxed =
          liqMsg.includes("insufficient_a_amount") || liqMsg.includes("insufficient_b_amount");
        if (!shouldRetryRelaxed) throw liqErr;

        // Taxed inputs can skew the token ratio after swap; retry LP add with relaxed mins.
        txLiquidity = await addLiquidity({
          tokenA: liqTokenA,
          tokenB: liqTokenB,
          amountADesired: liqAmountA,
          amountBDesired: liqAmountB,
          amountAMin: 0n,
          amountBMin: 0n,
          to: account.address,
          deadline,
          account,
        });
        pushToast({
          variant: "success",
          title: "Liquidity adjusted",
          description: "Retried LP add with relaxed min amounts due taxed-token ratio drift.",
        });
      }
      setStepStatus("add-liquidity", "done", txLiquidity?.transactionHash || txLiquidity?.hash);

      const lpAfter = lpAddress ? await waitForBalanceIncrease(lpAddress, lpBefore) : 0n;
      const minted = lpAfter > lpBefore ? lpAfter - lpBefore : 0n;
      if (minted <= 0n) throw new Error("LP minting failed.");

      const lpAllowanceRaw: any = await getErc20Allowance(lpAddress, account.address, poolAddress, "bsc").catch(() => 0n);
      const lpAllowance = toBigIntValue(lpAllowanceRaw);
      if (lpAllowance < minted) {
        setStepStatus("approve-stake", "pending");
        const txApprove: any = await approveErc20(lpAddress, poolAddress, 2n ** 255n, "bsc", account);
        setStepStatus("approve-stake", "done", txApprove?.transactionHash || txApprove?.hash);
      } else {
        setStepStatus("approve-stake", "done");
      }

      setStepStatus("stake", "pending");
      const stakingContract = getStakingContract(poolAddress, "bsc", selectedPoolType);
      const txStake: any = await stakeTokens(stakingContract, minted, account, selectedPoolType);
      setStepStatus("stake", "done", txStake?.transactionHash || txStake?.hash);

      pushToast({
        variant: "success",
        title: "Zap completed",
        description: "LP tokens staked successfully.",
      });
      await refreshPortfolio();
    } catch (e: any) {
      const msg = e?.message || "Zap failed.";
      setErrorMsg(msg);
      setSteps((prev) => prev.map((step) => (step.status === "pending" ? { ...step, status: "error" } : step)));
      pushToast({ variant: "error", title: "Zap failed", description: msg });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <div className="card p-6 space-y-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">RWA DeFi</h2>
            <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] text-white/60">
              PCS v2 LP
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] ${
                isFusionMode
                  ? "border border-cyan-400/40 bg-cyan-500/10 text-cyan-200"
                  : "border border-amber-400/40 bg-amber-500/10 text-amber-200"
              }`}
            >
              {isFusionMode ? "Fusion default" : "Instant default"}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-2">
          <div className="text-2xs uppercase tracking-[0.28em] text-white/50">Execution</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setZapMode("fusion")}
              disabled={processing}
              className={`rounded-md border px-3 py-2 text-xs transition ${
                zapMode === "fusion"
                  ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-100"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
              }`}
            >
              Fusion (private)
            </button>
            <button
              type="button"
              onClick={() => setZapMode("instant")}
              disabled={processing}
              className={`rounded-md border px-3 py-2 text-xs transition ${
                zapMode === "instant"
                  ? "border-amber-400/60 bg-amber-500/15 text-amber-100"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
              }`}
            >
              Instant PCS v2
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] text-white/55">
              {isFusionMode
                ? "Fusion protects from mempool frontrun but may wait for a resolver fill."
                : "Instant mode executes immediately on PancakeSwap v2 (public mempool)."}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void autoOptimizeExecution()}
              disabled={autoOptimizing || processing || !account?.address || !pool}
              className="px-2 py-1 text-3xs whitespace-nowrap"
            >
              {autoOptimizing ? "Auto…" : "Auto Best Rate"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-2xs text-white/60">
            Pool
            <select
              className="w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
              value={poolKey}
              onChange={(e) => setPoolKey(e.target.value)}
            >
              {LP_POOLS.map((p) => (
                <option key={p.key} value={p.key} className="text-black">
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-2xs text-white/60">
            Asset
            <select
              className="w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
            >
              {DEPOSIT_TOKENS.map((token) => (
                <option key={token.symbol} value={token.symbol} className="text-black">
                  {token.symbol}{token.isNative ? " (native)" : ""}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between text-[10px] text-white/45">
              <span>Contract: {shortAddress(depositMeta?.address)}</span>
              {fromToken === "ASX" && <span className="text-emerald-200/80">Default</span>}
            </div>
            {missingDepositAddress && (
              <div className="text-[10px] text-red-300">TOKEN ADDRESS REQUIRED</div>
            )}
          </label>

          <label className="space-y-2 text-2xs text-white/60">
            Amount
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.0"
                className="w-full bg-transparent text-sm text-white outline-none"
              />
              <span className="text-xs text-white/50">{fromToken}</span>
            </div>
            {account?.address && (
              <div className="flex items-center justify-between text-[10px] text-white/45">
                <span>Wallet: {selectedDepositBalanceDisplay}</span>
                {selectedDepositAsset && (
                  <button
                    type="button"
                    className="text-cyan-200 hover:text-cyan-100"
                    onClick={() => setAmount(formatUnitsPlain(selectedDepositAsset.balance, selectedDepositAsset.decimals, 6))}
                    disabled={processing}
                  >
                    Max
                  </button>
                )}
              </div>
            )}
          </label>

          <label className="space-y-2 text-2xs text-white/60">
            Slippage
            <div className="flex flex-wrap gap-2">
              {slippageOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSlippage(opt)}
                  className={`rounded-md border px-3 py-1 text-2xs transition ${
                    slippage === opt
                      ? "border-asx-cyan/70 bg-asx-cyan/20 text-white"
                      : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
                  }`}
                >
                  {opt}%
                </button>
              ))}
              {!isAsxDeposit && (
                <input
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-16 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-2xs text-white"
                />
              )}
            </div>
            {isAsxDeposit && (
              <div className="text-[10px] text-amber-200/80">
                ASX sell-tax mode: pick 3.1%+ to cover 3% sell tax.
              </div>
            )}
          </label>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/60">
          {isFusionMode
            ? "Fusion order submits privately. If unresolved after ~90s, order may still fill later until expiry."
            : "Instant swap routes directly through PancakeSwap v2 (public mempool)."}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="text-2xs uppercase tracking-[0.28em] text-white/50">Route Preview</div>
          <ol className="space-y-2 text-xs text-white/70">
            {isPoolToken ? (
              <li>1. {swapLabel} {formatAmount(half, fromToken)} → {swapTo ?? "token"}</li>
            ) : (
              <>
                <li>1. {swapLabel} {formatAmount(half, fromToken)} → {poolTokens[0] ?? "token"}</li>
                <li>2. {swapLabel} {formatAmount(half, fromToken)} → {poolTokens[1] ?? "token"}</li>
              </>
            )}
            <li>
              {addLiquidityStepIndex}. Add liquidity on PancakeSwap v2{" "}
              {formatAmount(tokenAOut, tokenA)} + {formatAmount(tokenBOut, tokenB)}
            </li>
            <li>
              {stakeStepIndex}. Stake LP tokens into {pool?.label ?? "selected"}{" "}
              <span className="text-white/40">({shortAddress(pool?.address)})</span>
            </li>
          </ol>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-2xs uppercase tracking-[0.28em] text-white/50">Estimated Output</div>
            {!prices && <div className="text-[10px] text-red-300">PRICE FEED OFF</div>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <EstimateCard
              label={`${tokenA ?? "Token A"} received`}
              value={formatAmount(tokenAOut, tokenA)}
              sub={formatUSD(tokenAUsd)}
            />
            <EstimateCard
              label={`${tokenB ?? "Token B"} received`}
              value={formatAmount(tokenBOut, tokenB)}
              sub={formatUSD(tokenBUsd)}
            />
            <EstimateCard
              label="Total value"
              value={formatUSD(totalUsdOut)}
              sub={asxEquivalent ? `${formatAmount(asxEquivalent, "ASX")} eq` : "--"}
            />
            <EstimateCard
              label="Stake to"
              value={shortAddress(pool?.address)}
              sub={pool?.label ?? "--"}
            />
          </div>
        </div>

        {networkMismatch && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-2xs text-red-300">
            <span>Switch to BNB Smart Chain to continue.</span>
            <Button
              size="sm"
              variant="ghost"
              className="px-2 py-1 text-3xs bg-red-500/30 hover:bg-red-500/40 text-red-100"
              onClick={() => wallet?.switchChain(bsc as any)}
            >
              Switch
            </Button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={startZap} disabled={!canStart || processing} className="px-6">
            {processing ? "Zapping…" : "Start Zap"}
          </Button>
          {!account?.address && <span className="text-3xs text-white/45">Connect wallet to start.</span>}
          {account?.address && !processing && !canStart && (
            <span className="text-3xs text-white/45">
              {missingDepositAddress ? "Token address missing." : "Enter amount to enable."}
            </span>
          )}
        </div>
        {!!account?.address && (
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/[0.07] p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-2xs uppercase tracking-[0.28em] text-cyan-200/90">Fusion Controls</div>
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelPendingFusionOrders}
                disabled={fusionCancelling || processing}
                className="px-2 py-1 text-3xs text-cyan-100 hover:bg-cyan-500/20"
              >
                {fusionCancelling ? "Cancelling…" : "Cancel pending"}
              </Button>
            </div>
            <div className="text-[10px] text-white/65">
              Cancels all pending and partially-filled Fusion orders for {shortAddress(account.address, 6)}.
            </div>
          </div>
        )}
        {errorMsg && <div className="text-3xs text-red-300">{errorMsg}</div>}
        {fusionOrderHash && (
          <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-2xs uppercase tracking-[0.28em] text-cyan-200/90">Fusion Order</div>
              <Button
                size="sm"
                variant="ghost"
                onClick={refreshFusionStatus}
                disabled={fusionChecking || processing}
                className="px-2 py-1 text-3xs text-cyan-100 hover:bg-cyan-500/20"
              >
                {fusionChecking ? "Checking…" : "Refresh"}
              </Button>
            </div>
            <div className="text-xs text-white/80">Hash: {shortAddress(fusionOrderHash, 6)}</div>
            <div className="text-xs text-white/70">
              Status: <span className="text-cyan-100">{formatFusionStatus(fusionStatus)}</span>
            </div>
            <div className="text-[10px] text-red-300">
              If status stays pending, it can still fill later until expiry. Switch to Instant mode for immediate swap.
            </div>
          </div>
        )}
        {steps.length > 0 && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 space-y-2">
            <div className="text-2xs uppercase tracking-[0.28em] text-white/50">Zap Steps</div>
            <div className="space-y-2 text-xs text-white/80">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2">
                  <StatusDot status={step.status} />
                  <span className="flex-1">{index + 1}. {step.label}</span>
                  {step.txHash && <span className="text-[10px] text-white/50">{shortAddress(step.txHash, 6)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-semibold">Stake Target</h3>
          <div className="grid gap-3">
            <EstimateCard
              label="Pool"
              value={pool?.label ?? "--"}
              sub={`${tokenA ?? "--"} / ${tokenB ?? "--"}`}
            />
            <EstimateCard
              label="Staking contract"
              value={shortAddress(pool?.address)}
              sub={pool?.address ?? "--"}
            />
          </div>
          {!pool?.address && <div className="text-3xs text-red-300">STAKING ADDRESS REQUIRED</div>}
        </div>
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Position & Withdraw</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void refreshPortfolio()}
              disabled={portfolioLoading || processing || !!withdrawAction}
              className="px-2 py-1 text-3xs"
            >
              {portfolioLoading ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <EstimateCard
              label="Staked LP"
              value={account?.address ? `${stakedLpDisplay} ${lpTokenSymbol}` : "--"}
              sub={pool?.label ?? "--"}
            />
            <EstimateCard
              label="Wallet LP"
              value={account?.address ? `${lpWalletDisplay} ${lpTokenSymbol}` : "--"}
              sub="Unstaked LP in wallet"
            />
            <EstimateCard
              label={`Claimable ${rewardTokenSymbol}`}
              value={account?.address ? `${claimableRewardsDisplay} ${rewardTokenSymbol}` : "--"}
              sub="Ready to claim"
            />
            <EstimateCard
              label="Connected Wallet"
              value={account?.address ? shortAddress(account.address, 6) : "--"}
              sub={account?.address ? "BNB Chain" : "Connect wallet"}
            />
          </div>

          <label className="space-y-2 text-2xs text-white/60">
            Withdraw Amount
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
              <input
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.0"
                className="w-full bg-transparent text-sm text-white outline-none"
              />
              <button
                type="button"
                className="text-2xs text-cyan-200 hover:text-cyan-100 disabled:opacity-50"
                onClick={() => setWithdrawAmount(formatUnitsPlain(stakedLpBalance, lpTokenDecimals, 6))}
                disabled={!account?.address || stakedLpBalance <= 0n || !!withdrawAction}
              >
                Max
              </button>
              <span className="text-xs text-white/50">{lpTokenSymbol}</span>
            </div>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => void withdrawStake("reverse")}
              disabled={!canWithdrawAmount}
              className="px-4"
            >
              {withdrawAction === "reverse" ? "Reversing…" : "Reverse to ASX"}
            </Button>
            <Button
              onClick={() => void withdrawStake("reverse-all")}
              disabled={!canWithdrawAll}
              variant="outline"
              className="px-4"
            >
              {withdrawAction === "reverse-all" ? "Reversing…" : "Reverse All to ASX"}
            </Button>
            <Button
              onClick={() => void withdrawStake("claim")}
              disabled={!canClaimRewards}
              variant="ghost"
              className="px-3"
            >
              {withdrawAction === "claim" ? "Claiming…" : "Claim Rewards"}
            </Button>
          </div>
          <div className="text-[10px] text-white/55">
            Reverse withdraw unstakes LP, removes liquidity, and swaps non-ASX assets into ASX.
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Wallet Assets</h3>
            {portfolioLoading && <span className="text-3xs text-white/50">Refreshing…</span>}
          </div>
          {!account?.address && <div className="text-3xs text-white/55">Connect wallet to view balances.</div>}
          {!!account?.address && (
            <div className="space-y-2">
              {walletAssetRows.length === 0 && (
                <div className="text-3xs text-white/55">No supported token balances found yet.</div>
              )}
              {walletAssetRows.map((asset) => (
                <div
                  key={asset.address}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                    asset.balance > 0n ? "border-white/12 bg-white/[0.035]" : "border-white/8 bg-white/[0.02]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs text-white/90 truncate">{asset.label || asset.symbol}</div>
                    <div className="text-[10px] text-white/45">{shortAddress(asset.address, 5)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/90">
                      {formatUnitsDisplay(asset.balance, asset.decimals, 6)} {asset.symbol}
                    </div>
                    <div className="text-[10px] text-white/45">
                      {asset.usdValue != null ? `$${asset.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "--"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function EstimateCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="text-3xs uppercase tracking-[0.24em] text-white/40">{label}</div>
      <div className="mt-1 text-sm font-medium text-white/90">{value}</div>
      {sub && <div className="text-3xs text-white/50">{sub}</div>}
    </div>
  );
}

function StatusDot({ status }: { status: StepStatus }) {
  const color =
    status === "done"
      ? "bg-emerald-400"
      : status === "pending"
        ? "bg-amber-400"
        : status === "error"
          ? "bg-red-400"
          : "bg-white/30";
  return <span className={`h-2 w-2 rounded-full ${color}`} />;
}
