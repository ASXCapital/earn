// file earn/src/hooks/useTotalStaked.ts

// hook for asx staking contracts rec 0x contract address and returns the totalSupply unit256

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ASXStakingABI } from '../abis/ASXStakingABI';

// Hook to fetch total staked amount from a given staking contract address
export const useTotalStaked = (contractAddress) => {
  const [totalStaked, setTotalStaked] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTotalStaked = async () => {
      if (!contractAddress) return;

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum); // Using MetaMask's provider
        const stakingContract = new ethers.Contract(contractAddress, ASXStakingABI, provider);
        
        const totalStakedAmount = await stakingContract.totalSupply();
        setTotalStaked(totalStakedAmount);
      } catch (error) {
        console.error('Error fetching total staked amount:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotalStaked();
  }, [contractAddress]); // Re-run the effect if the contract address changes

  return { totalStaked, isLoading };
};
