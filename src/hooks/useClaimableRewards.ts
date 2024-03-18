// src/hooks/useClaimableRewards.ts
import { useReadContract } from 'wagmi';
import { ASXStakingABI } from '../abis/ASXStakingABI';

export const useClaimableRewards = (stakingContractAddress: string, userAddress: string,) => {
    return useReadContract({
        abi: ASXStakingABI,
        address: stakingContractAddress as `0x${string}`, // Type assertion here
        functionName: 'claimableRewards',
        args: [userAddress as `0x${string}`], // Type assertion here
      });
};
