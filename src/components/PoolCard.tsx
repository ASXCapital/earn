// file: asx/earn/src/components/PoolCard.tsx

// IMPORTS
import React, { useEffect, useState, useRef, useMemo } from "react";
import { ethers } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import Image from "next/image";
import { BigNumberish } from "ethers";
import styles from "../styles/StakingPage.module.css";
import { PoolConfig } from "../config/poolsConfig";
import { contracts } from "../config/contracts";
import { useStakedAmount } from "../hooks/useStakedAmount";
import { useClaimableRewards } from "../hooks/useClaimableRewards";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { useTotalSupply } from "../hooks/useTotalSupply";
import { useRewardData } from "../hooks/useRewardData";
import useLPReserves from "../hooks/useLPReserves";
import StakeButton from "../hooks/StakeButton";
import WithdrawButton from "../hooks/WithdrawButton";
import GetRewardButton from "../hooks/GetRewardButton";
import { useTokenPricesContext } from "../contexts/TokenPricesContext";
import { useAccount, usePublicClient } from "wagmi";
import poolsConfig from "../config/poolsConfig";
import { ASXStakingABI } from "../abis/ASXStakingABI";

// Map of chain IDs to block explorer URLs
const explorerUrls = {
  56: "https://bscscan.com/address/",            // BSC Mainnet
  97: "https://testnet.bscscan.com/address/",    // BSC Testnet
  1116: "https://scan.coredao.org/address/",     // CoreDAO Mainnet
  // Add other chain IDs as needed
};

// INTERFACES

interface PoolCardProps {
  pool: PoolConfig;
  accountAddress: string;
  onStakedUSDChange: (amount: number) => void;
  onClaimableRewardsUSDChange: (amount: number) => void;
  onTVLChange: (poolId: string | number, tvl: number) => void;
  poolId: string | number; // This might already be included as part of `pool`
  style?: React.CSSProperties; // Add optional style prop
  className?: string; // Add optional className prop
}

/// MAIN FUNCTION ///////////////////

const PoolCard: React.FC<PoolCardProps> = ({
  pool,
  accountAddress,
  onTVLChange,
  style,
  className,
}) => {
  const prices = useTokenPricesContext();

  const publicClient = usePublicClient({ chainId: pool.chainId });

  const ASXTokenAddress = contracts.bscTokens.ASX;
  const [stakeAmount, setStakeAmount] = useState<string>("0.01");
  const [inputContent, setInputContent] = useState<string>("0.01");
  const [imageSrc, setImageSrc] = useState(
    pool.stakingToken.image || "/default_image.png",
  );
  const handleImageError = () => {
    setImageSrc("/default_image.png");
  };
  const SECONDS_IN_A_YEAR = 365 * 24 * 60 * 60;
  const [stakedAmount, setStakedAmount] = useState<bigint | null>(null);
  const [claimableRewards, setClaimableRewards] = useState<bigint | null>(null);
  const [tokenBalance, setTokenBalance] = useState<bigint | null>(null);

  const stakedAmountResult = useStakedAmount(
    pool.stakingContract.address as `0x${string}`,
    accountAddress,
  );
  const claimableRewardsResult = useClaimableRewards(
    pool.stakingContract.address as `0x${string}`,
    accountAddress,
  );
  const tokenBalanceResult = useTokenBalance(
    pool.stakingToken.address,
    accountAddress,
  );

  let contractAddresses = [pool.stakingToken.address];
  if (pool.type === "lp" && pool.stakingToken.constituents) {
    contractAddresses = [
      pool.stakingToken.constituents.token1.address,
      pool.stakingToken.constituents.token2.address,
    ];
  }

  const { reserve0, reserve1 } = useLPReserves(
    pool.stakingToken.address as `0x${string}`,
    publicClient,
    pool.stakingToken.abi // Use the correct ABI from the pool config
  );

  const totalSupply = useTotalSupply(
    pool.stakingToken.address as `0x${string}`,
    publicClient,
    pool.stakingToken.abi // Use the correct ABI from the pool config
  );

  const { rewardData } = useRewardData(
    pool.stakingContract.address as `0x${string}`,
    pool.rewardToken.address as `0x${string}`,
    publicClient,
    pool.stakingContract.abi // Use the correct ABI from the pool config
  );

  const [totalStaked, setTotalStaked] = useState<bigint | null>(null);
  const [isTotalStakedLoading, setIsTotalStakedLoading] = useState(true);

  useEffect(() => {
    const fetchTotalStaked = async () => {
      try {
        setIsTotalStakedLoading(true);
        const totalStakedData = await publicClient.readContract({
          address: pool.stakingContract.address as `0x${string}`,
          abi: ASXStakingABI,
          functionName: "totalSupply",
        });
        setTotalStaked(totalStakedData);
      } catch (error) {
        console.error("Error fetching total staked:", error);
      } finally {
        setIsTotalStakedLoading(false);
      }
    };

    fetchTotalStaked();
  }, [pool.stakingContract.address, publicClient]);

  /// LP PRICE CALCULATION ///////////////////

  const calculateLPPrice = () => {
    // Only proceed if it's an LP pool with all necessary data available
    if (
      pool.type !== "lp" ||
      !pool.stakingToken.constituents ||
      !totalSupply?.data ||
      reserve0 === undefined ||
      reserve1 === undefined
    ) {
      return "0"; // Return '0' for invalid or incomplete data sets
    }

    const { token1, token2 } = pool.stakingToken.constituents;

    const token2Price = prices[token1.address.trim().toLowerCase()];
    const token1Price = prices[token2.address.trim().toLowerCase()];

    const totalReserveUSD =
      Number(formatUnits(reserve0, 18)) * token1Price +
      Number(formatUnits(reserve1, 18)) * token2Price;
    const totalSupplyUnits = Number(formatUnits(totalSupply.data as BigNumberish, 18));
    const lpTokenPriceUSD =
      totalSupplyUnits > 0 ? totalReserveUSD / totalSupplyUnits : 0;

    return lpTokenPriceUSD.toFixed(4);
  };

  // Use useMemo to avoid recalculating LP price on every render
  const lpTokenPriceUSD = useMemo(calculateLPPrice, [
    pool,
    prices,
    totalSupply?.data,
    reserve0,
    reserve1,
  ]);

  useEffect(() => {
    if (stakedAmountResult.data !== undefined) {
      setStakedAmount(stakedAmountResult.data);
    }
    if (claimableRewardsResult.data) {
      const totalRewards = claimableRewardsResult.data.reduce(
        (acc, curr) => acc + curr.amount,
        BigInt(0),
      );
      setClaimableRewards(totalRewards);
    }
    if (tokenBalanceResult.data !== undefined) {
      setTokenBalance(tokenBalanceResult.data);
    }
  }, [stakedAmountResult, claimableRewardsResult, tokenBalanceResult]);

  const formatNumber = (value: number | bigint) =>
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value);

  const displayFormattedAmount = (
    amountInWei: BigNumberish | null,
    tokenAddress: string,
    symbol: string,
    useLpTokenPrice = false,
  ) => {
    if (amountInWei === null) return <span>Loading...</span>;
    const amountInEther = parseFloat(formatUnits(amountInWei, 18));

    // Map the Core DAO ASX address to the BSC ASX address
    const tokenAddressForPrice =
      tokenAddress.toLowerCase() === contracts.coreTokens.ASXcore.toLowerCase()
        ? contracts.bscTokens.ASX.toLowerCase()
        : tokenAddress.toLowerCase();

    let price = useLpTokenPrice
      ? parseFloat(lpTokenPriceUSD)
      : prices[tokenAddressForPrice] || 0;

    const amountInUSD = amountInEther * price;

    return (
      <>
        <span className={styles.numberValue}>
          {formatNumber(amountInEther)}
        </span>{" "}
        <span>{symbol}</span>
        {" ("}
        <span
          className={styles.usdValue}
        >{`$${formatNumber(amountInUSD)}`}</span>
        {")"}
      </>
    );
  };

  /// REWARD DATA CALCULATION FOR APR ///////////////////

  const [apr, setApr] = useState<number | null>(null);
  const [aprStatus, setAprStatus] = useState<string>("Calculating...");

  // APR calculation
  useEffect(() => {
    if (
      !isTotalStakedLoading &&
      totalStaked &&
      rewardData?.rewardRate &&
      prices
    ) {
      try {
        // Map addresses if necessary
        const stakingTokenAddressForPrice =
          pool.stakingToken.address.toLowerCase() === contracts.coreTokens.ASXcore.toLowerCase()
            ? contracts.bscTokens.ASX.toLowerCase()
            : pool.stakingToken.address.toLowerCase();

        const rewardTokenAddressForPrice =
          pool.rewardToken.address.toLowerCase() === contracts.coreTokens.ASXcore.toLowerCase()
            ? contracts.bscTokens.ASX.toLowerCase()
            : pool.rewardToken.address.toLowerCase();

        const stakingTokenPriceUSD =
          pool.type === "lp"
            ? parseFloat(lpTokenPriceUSD)
            : prices[stakingTokenAddressForPrice] || 0;
        const rewardTokenPriceUSD = prices[rewardTokenAddressForPrice] || 0;

        const totalRewardsPerYearTokens =
          parseFloat(formatUnits(rewardData.rewardRate, 18)) *
          SECONDS_IN_A_YEAR;
        const totalRewardsPerYearInUSD =
          totalRewardsPerYearTokens * rewardTokenPriceUSD;

        const totalStakedTokens = parseFloat(formatUnits(totalStaked, 18));
        const totalTVLInUSD = totalStakedTokens * stakingTokenPriceUSD;

        const apr =
          totalTVLInUSD > 0
            ? (totalRewardsPerYearInUSD / totalTVLInUSD) * 100
            : 0;

        setApr(apr);
        setAprStatus(`${apr.toFixed(2)}`);
      } catch (error) {
        console.error("Error calculating APR:", error);
        setAprStatus("Error");
      }
    } else {
      setAprStatus("Calculating...");
    }
  }, [
    rewardData,
    totalStaked,
    isTotalStakedLoading,
    prices,
    pool.rewardToken.address,
    pool.type,
    pool.stakingToken.address,
    lpTokenPriceUSD,
    SECONDS_IN_A_YEAR,
  ]);

  /// STAKING UPDATE/REFRESH

  const handleStakeUpdate = () => {
    stakedAmountResult.refetch();
    claimableRewardsResult.refetch();
    tokenBalanceResult.refetch();
  };
  const [inputStatus, setInputStatus] = useState("empty");
  useEffect(() => {
    const interval = setInterval(() => {
      handleStakeUpdate();
    }, 900000000);
    return () => clearInterval(interval);
  }, []);

  /// INPUT HANDLING ///////////////////

  const handleWithdraw = () => {
    const stakedAmountInEthers = stakedAmount
      ? ethers.utils.formatUnits(stakedAmount, 18)
      : "0";
    const withdrawalAmount =
      stakeAmount === "" ? stakedAmountInEthers : stakeAmount;
    return withdrawalAmount;
  };

  const handleInputStatusChange = () => {
    setInputStatus((prevStatus) =>
      prevStatus === "wallet" ? "clear" : "wallet",
    );
    if (inputStatus === "clear") {
      setInputContent(""); // Ensure inputContent is cleared when "Clear" is clicked
    }
  };

  useEffect(() => {
    if (inputStatus === "wallet") {
      setStakeAmount(
        tokenBalance ? ethers.utils.formatUnits(tokenBalance, 18) : "",
      );
      setInputContent(
        tokenBalance ? ethers.utils.formatUnits(tokenBalance, 18) : "",
      ); // Update inputContent when setting max wallet
    } else {
      setStakeAmount("");
      setInputContent(""); // Clear inputContent along with stakeAmount
    }
  }, [inputStatus, tokenBalance]);

  const handleStakeAmountChange = (e) => {
    const value = e.target.value;
    const regex = /^\d*\.?\d{0,18}$/;

    if (value === "" || regex.test(value)) {
      setStakeAmount(value);
      setInputContent(value); // Update inputContent based on the current input field content
    }
  };

  /// TVL CALCULATION ///////////////////

  const calculateTVLinUSD = () => {
    if (!totalStaked) return "Loading...";

    // Total staked tokens in the pool (converted from Wei to a normal number)
    const totalStakedTokens = parseFloat(formatUnits(totalStaked, 18));
    let totalStakedInUSD = 0;

    // For LP token pools
    if (pool.type === "lp") {
      // Use the LP token price calculated from reserves
      const lpTokenPriceUSD = parseFloat(calculateLPPrice());
      totalStakedInUSD = totalStakedTokens * lpTokenPriceUSD;
    } else {
      // For single token pools, use the price from the token prices context
      const stakingTokenAddressForPrice =
        pool.stakingToken.address.toLowerCase() === contracts.coreTokens.ASXcore.toLowerCase()
          ? contracts.bscTokens.ASX.toLowerCase()
          : pool.stakingToken.address.toLowerCase();

      const tokenPriceUSD = prices[stakingTokenAddressForPrice] || 0;
      totalStakedInUSD = totalStakedTokens * tokenPriceUSD;
    }

    return formatNumber(totalStakedInUSD);
  };

  const tvlInUSD = calculateTVLinUSD();
  const lastReportedTVL = useRef<number>();

  useEffect(() => {
    const currentTVLString = calculateTVLinUSD().replace(/,/g, "");
    const currentTVL = parseFloat(currentTVLString);

    if (
      !isNaN(currentTVL) &&
      currentTVLString !== "Loading..." &&
      currentTVL !== lastReportedTVL.current
    ) {
      onTVLChange(pool.id, currentTVL);
      lastReportedTVL.current = currentTVL;
    }
  }, [pool.id, onTVLChange, totalStaked, totalSupply, reserve0, reserve1, prices]);

  useEffect(() => {
    const formatData = (data: any) => (typeof data === "bigint" ? data.toString() : data);
  }, [
    pool,
    stakedAmountResult,
    claimableRewardsResult,
    tokenBalanceResult,
    totalStaked,
    isTotalStakedLoading,
    reserve0,
    reserve1,
    rewardData,
    totalSupply,
    apr,
    tvlInUSD,
    accountAddress,
  ]);

  /// FRONTEND/RENDER ///////////////////

  // Get the chain ID from the pool
  const chainId = pool.chainId;

  // Get the appropriate block explorer URL
  const explorerUrl = explorerUrls[chainId] || "https://etherscan.io/address/";

  // Define the image source based on the chain ID
  const buyLogoSrc =
    chainId === 1116 // CoreDAO Mainnet chain ID
      ? "/logos/icecream.webp" // Path to your ice cream logo
      : "/logos/PancakeSwap Logos/Full Logo/bunny-color.svg"; // Default PancakeSwap logo

  return (
    <div className={`${styles.poolCard} ${className || ""}`}>
      <div className={styles.cardHeader}>
        <div className={styles.titleAndLogoContainer}>
          <div className={styles.titleAndLogo}>
            <h1 className={styles.poolTitle}>{pool.title}</h1>
            <a
              href={pool.stakingToken.buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.buyLink}
            >
              <Image
                src={buyLogoSrc}
                alt="Buy Logo"
                width={16}
                height={16}
              />
            </a>
          </div>
        </div>

        <div className={styles.logoContainer}>
          <Image
            src={imageSrc}
            alt="Token Logo"
            width={40}
            height={40}
            priority
            onError={handleImageError}
          />
        </div>
        <div className={styles.TotalTVLContainer}>
          <div className={styles.tvl}>
            TVL: <strong>${tvlInUSD}</strong>
          </div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.PricesAndAPR}>
          <div className={styles.aprAndPrice}>
            <div className={styles.apr}>
              <span className={styles.aprNumber}>{aprStatus}</span>
              <span className={styles.aprPercent}>%</span>
              <span className={styles.aprText}>APR</span>
            </div>
            <div>
              Price: $
              {pool.type === "lp"
                ? lpTokenPriceUSD
                : prices[
                pool.stakingToken.address.toLowerCase() === contracts.coreTokens.ASXcore.toLowerCase()
                  ? contracts.bscTokens.ASX.toLowerCase()
                  : pool.stakingToken.address.toLowerCase()
                ] || "Loading..."}
            </div>
          </div>
          <div className={styles.UserStats}>
            <div className={styles.poolInfo}>
              <span>Wallet:</span>
              {/* Use displayFormattedAmount for wallet balance, passing true for useLpTokenPrice if it's an LP token */}
              <span>
                {displayFormattedAmount(
                  tokenBalance,
                  pool.stakingToken.address,
                  pool.stakingToken.symbol,
                  pool.type === "lp",
                )}
              </span>
            </div>
            <div className={styles.poolInfo}>
              <span>Staked:</span>
              {/* Use displayFormattedAmount for staked amount, also passing true for useLpTokenPrice if it's an LP token */}
              <span>
                {displayFormattedAmount(
                  stakedAmount,
                  pool.stakingToken.address,
                  pool.stakingToken.symbol,
                  pool.type === "lp",
                )}
              </span>
            </div>
            <div className={styles.poolInfo}>
              <span>Claimable:</span>
              <span>
                {displayFormattedAmount(
                  claimableRewards,
                  ASXTokenAddress,
                  "$ASX",
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actionSection}>
        <div className={styles.maxAndInput}>
          <button
            className={styles.actionButtonMAX}
            onClick={handleInputStatusChange}
          >
            {inputContent === "" ? "Max." : "Clear"}
          </button>
          <input
            className={styles.stakeInput}
            type="text"
            value={stakeAmount}
            onChange={handleStakeAmountChange}
            placeholder="Token Amount"
          />
        </div>
        <div className={styles.Buttons3}>
          <StakeButton
            tokenAddress={pool.stakingToken.address}
            stakingContractAddress={pool.stakingContract.address}
            amount={stakeAmount}
            onUpdate={handleStakeUpdate}
            poolChainId={pool.chainId}
          />

          <WithdrawButton
            stakingContractAddress={pool.stakingContract.address}
            amount={handleWithdraw()}
            onUpdate={handleStakeUpdate}
            poolChainId={pool.chainId}
          />

          <GetRewardButton
            stakingContractAddress={pool.stakingContract.address}
            onUpdate={handleStakeUpdate}
            poolChainId={pool.chainId}
          />
        </div>
      </div>
      <div className={styles.cardFooter}>
        Contract Address (
        <a
          href={`${explorerUrl}${pool.stakingContract.address}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {`${pool.stakingContract.address.slice(0, 6)}...${pool.stakingContract.address.slice(-4)}`}
        </a>
        )
      </div>
    </div>
  );
};

export default PoolCard;
