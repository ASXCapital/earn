// src/hooks/useTotalClaimableRewards.ts
import { useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import { useClaimableRewards } from './useClaimableRewards';
import poolsConfig from '../config/poolsConfig';

export const useTotalClaimableRewards = (userAddress: string) => {
  const [totalClaimableRewards, setTotalClaimableRewards] = useState(BigNumber.from(0));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRewards = async () => {
      setIsLoading(true);
      let totalRewards = BigNumber.from(0);

      // Use Promise.all to fetch all rewards concurrently
      const rewardsResults: BigNumber[] = []; // Declare rewardsResults variable

      rewardsResults.forEach(reward => {
        if (reward) {
          totalRewards = totalRewards.add(reward);
        }
      });

      setTotalClaimableRewards(totalRewards);
      setIsLoading(false);
    };

    loadRewards();
  }, [userAddress]);

  return { totalClaimableRewards, isLoading };
};
