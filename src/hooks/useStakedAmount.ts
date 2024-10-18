// file: src/hooks/useStakedAmount.ts

// Staked amount for INDIVIDUAL stakers

import { useReadContract } from "wagmi";
import { ASXStakingABI } from "../abis/ASXStakingABI";

export const useStakedAmount = (
  stakingContractAddress: string,
  accountAddress?: string,
  chainId?: number, // Add chainId parameter
) => {
  const address =
    accountAddress || "0x0000000000000000000000000000000000000000"; // Use zero address if accountAddress is not available
  return useReadContract({
    abi: ASXStakingABI,
    address: stakingContractAddress as `0x${string}`,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    chainId, // Specify chainId
  });
};
