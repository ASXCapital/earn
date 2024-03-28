// src/pages/StakingPage.tsx
import React, { useEffect, useState } from 'react';
import { usePools } from '../hooks/usePools';
import styles from '../styles/StakingPage.module.css';
import { useAccount } from 'wagmi';
import PoolCard from '../components/PoolCard';

const StakingPage = () => {
  const { pools } = usePools();
  const { address } = useAccount();
  const [clientReady, setClientReady] = useState(false);
  const [totalStakedUSD, setTotalStakedUSD] = useState<number>(0);
  const [totalClaimableRewardsUSD, setTotalClaimableRewardsUSD] = useState<number>(0);
  const [poolTVLs, setPoolTVLs] = useState<Record<string | number, number>>({}); // Updated type for poolTVLs

  const handleTVLChange = (poolId: string | number, tvl: number) => {
    setPoolTVLs(prevTVLs => ({
      ...prevTVLs,
      [poolId]: tvl,
    }));
  };

  // Ensure all values in poolTVLs are numbers for TypeScript
  const overallTVL = Object.values(poolTVLs).reduce((acc, tvl) => acc + (tvl as number), 0);
  const formattedOverallTVL = new Intl.NumberFormat('en-US').format(overallTVL); // Format the overall TVL

  useEffect(() => {
    setClientReady(true); // Set clientReady to true once the component mounts on the client
  }, []);

  const handleStakedUSDChange = (amount: number) => {
    setTotalStakedUSD(prevTotal => prevTotal + amount);
  };

  const handleClaimableRewardsUSDChange = (amount: number) => {
    setTotalClaimableRewardsUSD(prevTotal => prevTotal + amount);
  };

  if (!clientReady) {
    return <div>Loading...</div>; // Render a consistent loading state initially
  }

  return (
    <div className={styles.stakingWrapper}>
      <div className={styles.poolCardHeader}>
        <h1>Staking Pools</h1>
        <div>Total USD Staked: {totalStakedUSD.toFixed(2)}</div>
        <div>Total USD in Claimable Rewards: {totalClaimableRewardsUSD.toFixed(2)}</div>
        <div>classname={styles.TotalTVLContainer}
        <div>Total TVL Across All Pools: $<div className={styles.TotalTVL}>{formattedOverallTVL}</div>
        </div>
        </div>
      </div>
      <div className={styles.poolsContainer}>
        {pools.map((pool) => (
          <PoolCard
            key={pool.id}
            pool={pool}
            accountAddress={address || ''}
            onStakedUSDChange={handleStakedUSDChange}
            onClaimableRewardsUSDChange={handleClaimableRewardsUSDChange}
            onTVLChange={handleTVLChange}
            poolId={pool.id}
          />
        ))}
      </div>
    </div>
  );
};

export default StakingPage;
