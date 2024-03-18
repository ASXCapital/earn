import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import Image from 'next/image';
import { formatUnits } from 'ethers/lib/utils';
import { useStakedAmount } from '../hooks/useStakedAmount';
import { useClaimableRewards } from '../hooks/useClaimableRewards';
import { useTokenBalance } from '../hooks/useTokenBalance';
import styles from '../styles/StakingPage.module.css';
import { PoolConfig } from '../config/poolsConfig';
import useTokenPrices from '../hooks/useTokenPrices';
import { BigNumberish, BigNumber} from 'ethers';
import { contracts } from '../config/contracts';
import useLPReserves from '../hooks/useLPReserves';
import { useTotalSupply } from '../hooks/useTotalSupply';
import { useRewardData } from '../hooks/useRewardData';




interface PoolCardProps {
  pool: PoolConfig;
  accountAddress: string;
  onStakedUSDChange: (amount: number) => void;
  onClaimableRewardsUSDChange: (amount: number) => void;
}

const PoolCard: React.FC<PoolCardProps> = ({ pool, accountAddress, onStakedUSDChange, onClaimableRewardsUSDChange }) => {
  const ASXTokenAddress = contracts.bscTokens.ASX;

  const SECONDS_IN_A_YEAR = 365 * 24 * 60 * 60; // Define the constant

  const defaultImagePath = '/default_image.png';

  const [stakedAmount, setStakedAmount] = useState<bigint | null>(null);
  const [claimableRewards, setClaimableRewards] = useState<bigint | null>(null);
  const [tokenBalance, setTokenBalance] = useState<bigint | null>(null);

  const stakedAmountResult = useStakedAmount(pool.stakingContract.address, accountAddress);
  const claimableRewardsResult = useClaimableRewards(pool.stakingContract.address, accountAddress);
  const tokenBalanceResult = useTokenBalance(pool.stakingToken.address, accountAddress);

  let contractAddresses = [pool.stakingToken.address];
  if (pool.type === 'lp' && pool.stakingToken.constituents) {
    contractAddresses = [
      pool.stakingToken.constituents.token1.address,
      pool.stakingToken.constituents.token2.address,
    ];
  }

  const platformId = 'binance-smart-chain';
  const prices = useTokenPrices(platformId, [...contractAddresses, ASXTokenAddress]);


  const { reserve0, reserve1 } = useLPReserves(pool.stakingToken.address);
  const totalSupply = useTotalSupply(pool.stakingToken.address);
  const { rewardData } = useRewardData(pool.stakingContract.address, pool.rewardToken.address);
  const [apr, setApr] = useState<number | null>(null);
  const [aprStatus, setAprStatus] = useState<string>('Calculating...'); // Default to 'Calculating...' until the first calculation completes
 // Default to 'Calculating...' until the first calculation completes




  const calculateLPPrice = () => {
    if (pool.type !== 'lp' || !pool.stakingToken.constituents || !totalSupply?.data) {
      return prices[ASXTokenAddress]?.toFixed(2) || 'Loading...';
    }

    const token1Price = prices[pool.stakingToken.constituents.token1.address] || 0;
    const token2Price = prices[pool.stakingToken.constituents.token2.address] || 0;

    const totalReserveUSD =
      Number(formatUnits(reserve1, 18)) * token1Price +
      Number(formatUnits(reserve0, 18)) * token2Price;
    const totalSupplyUnits = Number(formatUnits(totalSupply.data, 18));

    const lpTokenPriceUSD = totalReserveUSD / totalSupplyUnits;
    return lpTokenPriceUSD.toFixed(2); // Reduce decimal places
  };

  const lpTokenPriceDisplay = calculateLPPrice();

  useEffect(() => {
    if (stakedAmountResult.data !== undefined) {
      setStakedAmount(stakedAmountResult.data);
    }

    if (claimableRewardsResult.data) {
      const totalRewards = claimableRewardsResult.data.reduce((acc, curr) => acc + curr.amount, BigInt(0));
      setClaimableRewards(totalRewards);
    }

    if (tokenBalanceResult.data !== undefined) {
      setTokenBalance(tokenBalanceResult.data);
    }
  }, [stakedAmountResult, claimableRewardsResult, tokenBalanceResult]);

  useEffect(() => {
    if (
      rewardData &&
      totalSupply.data &&
      prices[pool.stakingToken.address] &&
      prices[pool.rewardToken.address]
    ) {
      try {
        const rewardTokenPriceInWei = ethers.utils.parseUnits(prices[pool.rewardToken.address].toString(), 'ether');
        const stakingTokenPriceInWei = ethers.utils.parseUnits(prices[pool.stakingToken.address].toString(), 'ether');
  
        const rewardRatePerYear = rewardData.rewardRate.mul(SECONDS_IN_A_YEAR);
        const totalRewardsPerYearInWei = rewardRatePerYear.mul(rewardTokenPriceInWei);
  
        const totalStakedInWei = BigNumber.from(totalSupply.data.toString());
        const totalStakedInUSD = totalStakedInWei.mul(stakingTokenPriceInWei);
  
        let aprValue = BigNumber.from(0); // Initialize aprValue as a BigNumber
  
        if (!totalStakedInUSD.isZero()) {
          console.log ('totalStakedInUSD:', totalStakedInUSD.toString());
          console.log ('totalRewardsPerYearInWei:', totalRewardsPerYearInWei.toString());
          
          // Calculate APR using BigNumber operations
          aprValue = totalRewardsPerYearInWei.mul(10000).div(totalStakedInUSD); // APR in basis points for better precision
        }
  
        // Convert APR from basis points to percentage for display, converting to string to handle large numbers
        const aprPercentage = aprValue.div(100).toNumber(); // Convert to number
        setApr(aprPercentage);
        setAprStatus(`${aprPercentage.toFixed(2)}%`); // Set the status to the calculated APR
      } catch (error) {
        console.error("Error calculating APR:", error);
        setAprStatus('Error'); // Indicate an error state
      }
    } else {
      setAprStatus('Calculating...'); // Data not ready
    }
  }, [rewardData, totalSupply.data, prices, pool.stakingToken.address, pool.rewardToken.address, SECONDS_IN_A_YEAR]);
  

  const formatNumber = (value: number | bigint) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value);

    const displayFormattedAmount = (amountInWei: BigNumberish | null, tokenAddress: string, symbol: string) => {
      if (amountInWei === null) return 'Loading...';
      const amountInEther = parseFloat(formatUnits(amountInWei, 18));
      let price = prices[tokenAddress] || 0;
      if (pool.type === 'lp' && tokenAddress === pool.stakingToken.address) {
        price = parseFloat(lpTokenPriceDisplay);
      }
      const amountInUSD = amountInEther * price;
      return `${formatNumber(amountInEther)} (${formatNumber(amountInUSD)} USD) ${symbol}`;
    };

  return (
    <div className={styles.poolCard}>
      {/* Header */}
      <div className={styles.cardHeader}>
        {/* Pool Title */}
        <div className={styles.titleAndTvl}>
          <h1 className={styles.poolTitle}>{pool.title}</h1>
          {/* TVL */}
          <div className={styles.tvl}>TVL: <strong>Loading...</strong></div>
        </div>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <Image src={defaultImagePath} alt="Token Logo" width={40} height={40} priority />
        </div>
        {/* APR & LP Token Price */}
        <div className={styles.aprAndPrice}>
          <div>{aprStatus} APR</div> {/* Adjusted line */}
          
      
          <div>{pool.title} Price: $ {lpTokenPriceDisplay}</div> {/* Adjusted line */}
        </div>
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        {/* Token Balance */}
        <div className={styles.poolInfo}>
          <span>{pool.title} in Wallet:</span>
          <span><strong>{displayFormattedAmount(tokenBalance, pool.stakingToken.address, pool.stakingToken.symbol)}</strong></span>
        </div>
        {/* Staked Amount */}
        <div className={styles.poolInfo}>
          <span>Staked:</span>
          <span><strong>{displayFormattedAmount(stakedAmount, pool.stakingToken.address, pool.stakingToken.symbol)}</strong></span>
        </div>
        {/* Claimable Rewards */}
        <div className={styles.poolInfo}>
          <span>Claimable Rewards:</span>
          <span><strong>{displayFormattedAmount(claimableRewards, ASXTokenAddress, '$ASX')}</strong></span>
        </div>
        {/* Actions */}
        <div className={styles.actionSection}>
          <input className={styles.stakeInput} type="number" placeholder="0" />
          <button className={styles.actionButton}>Stake</button>
          <button className={styles.actionButton}>Unstake</button>
          <button className={styles.actionButton}>Claim</button>
          <button className={styles.actionButton}>Revoke</button>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        <a href={`https://bscscan.com/address/${pool.stakingContract.address}`} target="_blank" rel="noopener noreferrer">
          Contract Address
        </a>
      </div>
    </div>
  );
};

export default PoolCard;
