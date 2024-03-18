// file: src/hooks/useStakedAmount.ts

import { useReadContract } from 'wagmi';
import { ASXStakingABI } from '../abis/ASXStakingABI';

export const useStakedAmount = (stakingContractAddress: string, accountAddress?: string) => {
  const address = accountAddress || '0x0'; // Use a placeholder if accountAddress is not available
  return useReadContract({
    abi: ASXStakingABI,
    address: stakingContractAddress as `0x${string}`,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });
};
