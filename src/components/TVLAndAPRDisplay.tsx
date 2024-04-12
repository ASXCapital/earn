import React, { useCallback, useEffect, useState } from 'react';
import styles from './TVLAndAPRDisplay.module.css';
import poolsConfig from '../config/poolsConfig';
import { useTokenPricesContext } from '../contexts/TokenPricesContext';
import { useTotalStaked } from '../hooks/useTotalStaked';
import useLPReserves from '../hooks/useLPReserves';
import { useTotalSupply } from '../hooks/useTotalSupply';
import { useRewardData } from '../hooks/useRewardData';
import { formatUnits } from 'ethers/lib/utils';


interface TVLAndAPRDisplayProps {
  poolId: string;
}

const TVLAndAPRDisplay: React.FC<TVLAndAPRDisplayProps> = ({ poolId }) => {
  const pool = poolsConfig.find(p => p.id === poolId);
  const prices = useTokenPricesContext();
  const { totalStaked } = useTotalStaked(pool ? pool.stakingContract.address : '');
  const { reserve0, reserve1 } = useLPReserves(pool ? pool.stakingToken.address : '');
  const { data: totalSupply } = useTotalSupply(pool ? pool.stakingToken.address : '');
  const { rewardData } = useRewardData(pool ? pool.stakingContract.address : '', pool ? pool.rewardToken.address : '');
  const [apy, setApy] = useState<string>('Calculating...');
  const [tvl, setTvl] = useState<string>('Calculating...');

  const calculateLPPrice = useCallback(() => {
    if (pool?.type === 'lp' && reserve0 && reserve1 && totalSupply) {
      const token1 = pool.stakingToken.constituents.token1;
      const token2 = pool.stakingToken.constituents.token2;
      const price1 = prices[token1.address.toLowerCase()] ? BigInt(Math.round(prices[token1.address.toLowerCase()] * 1e18)) : BigInt(0);
      const price2 = prices[token2.address.toLowerCase()] ? BigInt(Math.round(prices[token2.address.toLowerCase()] * 1e18)) : BigInt(0);
      const totalReserveValue = (reserve1 * price1 + reserve0 * price2) / BigInt(1e18);
      return Number(totalReserveValue) / Number(totalSupply);
    }
    return 0;
  }, [pool, reserve0, reserve1, totalSupply, prices]);

  useEffect(() => {
    if (!pool || !totalStaked || !totalSupply || !rewardData) return;

    const stakingTokenPriceUSD = pool.type === 'lp' ? calculateLPPrice() : prices[pool.stakingToken.address.toLowerCase()] || 0;
    const totalStakedTokens = parseFloat(formatUnits(totalStaked, 18));
    const totalTVLInUSD = totalStakedTokens * stakingTokenPriceUSD;
    setTvl(totalTVLInUSD.toFixed(2));

    // Calculate APY
    if (rewardData) {
      const rewardRate = parseFloat(formatUnits(rewardData.rewardRate, 18));
      const rewardPerYear = rewardRate * 31536000; // Calculate rewards per year
      const rewardTokenPrice = prices[pool.rewardToken.address.toLowerCase()] || 0;
      const rewardsValuePerYear = rewardPerYear * rewardTokenPrice;
      const apr = rewardsValuePerYear / totalTVLInUSD; // Calculate APR as decimal
      const compoundingEffect = 365; // Daily compounding
      const apy = (Math.pow(1 + apr / compoundingEffect, compoundingEffect) - 1) * 100; // Calculate APY
      setApy(apy.toFixed(2));
    }
  }, [pool, totalStaked, prices, calculateLPPrice, totalSupply, rewardData]);

  if (!pool) {
    return <div>Pool not found</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.tvl}>
        TVL: <strong>${tvl}</strong>
      </div>
      <div className={styles.apy}>
        <span className={styles.apyValue}>{apy}</span>
        <span className={styles.apyLabel}>% APY</span>
      </div>
    </div>
  );
};



export default TVLAndAPRDisplay;
