// src/pages/StakingPage.tsx
import React, { useEffect, useState } from 'react';
import { usePools } from '../hooks/usePools';
import styles from '../styles/StakingPage.module.css';
import { useAccount } from 'wagmi';
import PoolCard from '../components/PoolCard';
import { useTotalClaimableRewards } from '../hooks/useTotalClaimableRewards';




const StakingPage = () => {
  const { pools } = usePools();
  const { address } = useAccount();
  const [clientReady, setClientReady] = useState(false);
  const [totalStakedUSD, setTotalStakedUSD] = useState<number>(0);
  const [totalClaimableRewardsUSD, setTotalClaimableRewardsUSD] = useState<number>(0);
  
  const { totalClaimableRewards, isLoading: isTotalRewardsLoading } = useTotalClaimableRewards(address);

  const [poolTVLs, setPoolTVLs] = useState<Record<string | number, number>>({}); // Updated type for poolTVLs

  const handleTVLChange = (poolId: string | number, tvl: number) => {
    setPoolTVLs(prevTVLs => ({
      ...prevTVLs,
      [poolId]: tvl,
    }));
  };

  // Ensure all values in poolTVLs are numbers for TypeScript
  const overallTVL = Object.values(poolTVLs).reduce((acc, tvl) => acc + (tvl as number), 0);
  const roundedOverallTVL = Math.round(overallTVL); // Round to the nearest integer
  const formattedOverallTVL = new Intl.NumberFormat('en-US').format(roundedOverallTVL); // Format the rounded TVL
  
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
<div className={styles.StakingIntro}>
<p>Earn via staking with ASX. Simply stake your ASX tokens and recieve ASX as the reward token. Alternatively, diversify your 
      position and create an LP with either Ethereum, BNB or Bitcoin
    </p>
    <p>A comprehensive guide to staking with ASX and creation of LP tokens can be found <a href="https://medium.com/@ASXCapital/how-to-earn-with-asx-staking-5ba6c53f95f5"><u>here</u></a></p>
    
  <div>
   
     {/* 
      {isTotalRewardsLoading ? (

        <div>Loading total claimable rewards...</div>
      ) : (
        <div>Total Claimable Rewards: {totalClaimableRewards.toString()} ASX</div>
      )}
   */}
    

    
 {/* 
  <div>Total USD Staked: {totalStakedUSD.toFixed(2)}</div>
  <div>Total USD in Claimable Rewards: {totalClaimableRewardsUSD.toFixed(2)}</div>
  */}
  <div style={{ display: 'flex', alignItems: 'center' }}>
    
    <div style={{ flexGrow: 1 }}></div> 
  <div className={styles.totalTVLContainer}>
    <span className={styles.totalTVL}>${formattedOverallTVL}<span className={styles.totalTVLmini}> TVL</span></span>
  </div>
</div>
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
