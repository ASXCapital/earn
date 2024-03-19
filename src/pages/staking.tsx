// src/pages/StakingPage.tsx
import React, { useEffect, useState } from 'react';
import { usePools } from '../hooks/usePools';
import styles from '../styles/StakingPage.module.css';
import { useAccount } from 'wagmi';
import PoolCard from '../components/PoolCard'; // Make sure this path is correct

const StakingPage = () => {
  const { pools } = usePools();
  const { address } = useAccount();
  const [clientReady, setClientReady] = useState(false);
  const [totalStakedUSD, setTotalStakedUSD] = useState<number>(0);
  const [totalClaimableRewardsUSD, setTotalClaimableRewardsUSD] = useState<number>(0);

  useEffect(() => {
    // Set clientReady to true once the component mounts on the client
    setClientReady(true);
  }, []);

  const handleStakedUSDChange = (amount: number) => {
    setTotalStakedUSD(prevTotal => prevTotal + amount);
  };

  const handleClaimableRewardsUSDChange = (amount: number) => {
    setTotalClaimableRewardsUSD(prevTotal => prevTotal + amount);
  };

  if (!clientReady) {
    // Render a consistent loading state initially
    return <div>Loading...</div>;
  }

  // Proceed with rendering content that depends on client-side data
  const accountAddress = address || '';
  return (
    <div className={styles.stakingWrapper}>
      <div className={styles.poolCardHeader}>
      <h1>Staking Pools</h1>
      <div>Total USD Staked: {totalStakedUSD} USD</div>
      <div>Total USD in Claimable Rewards: {totalClaimableRewardsUSD} USD</div>
      </div>
      <div className={styles.poolsContainer}>

        {pools.map((pool) => (
          <PoolCard
            key={pool.id}
            pool={pool}
            accountAddress={accountAddress}
            onStakedUSDChange={handleStakedUSDChange}
            onClaimableRewardsUSDChange={handleClaimableRewardsUSDChange}
          />
        ))}
      </div>
    </div>
  );
};

export default StakingPage;