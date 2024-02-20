// components/StakingComponent.js

import React from 'react';
import styles from './StakingComponent.module.css'; // Adjust the path as necessary

const StakingComponent = ({ poolName, apr, stakedTokens, contractAddress, onStake, onUnstake }) => {
  return (
    <div className={styles.stakingWrapper}>
      <h1 className={styles.dashboardTitle}>Staking Dashboard</h1>
      <div className={styles.stakingPool}>
        <div className={styles.poolHeader}>
          <h2 className={styles.poolName}>{poolName}</h2>
          <p className={styles.apr}>APR: <span className={styles.aprValue}>{apr}%</span></p>
        </div>
        <div className={styles.poolDetails}>
          <p className={styles.stakeDetail}>Your Stake: <span className={styles.stakeAmount}>{stakedTokens} Tokens</span></p>
          <div className={styles.actionButtons}>
            <button className={styles.stakeButton} onClick={onStake}>Stake More</button>
            <button className={styles.unstakeButton} onClick={onUnstake}>Unstake</button>
          </div>
        </div>
      </div>
      <div className={styles.contractInfo}>
        <p>Contract Address: <a href="#" className={styles.contractLink}>{contractAddress}</a></p>
      </div>
    </div>
  );
};

export default StakingComponent;
