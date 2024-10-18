// file: src/hooks/useClaimableRewards.ts

import { useReadContract } from "wagmi";
import { ASXStakingABI } from "../abis/ASXStakingABI";

export const useClaimableRewards = (
  stakingContractAddress: string,
  userAddress?: string,
  chainId?: number, // Add chainId parameter
) => {
  const address =
    userAddress || "0x0000000000000000000000000000000000000000"; // Use zero address if userAddress is not available
  return useReadContract({
    abi: ASXStakingABI,
    address: stakingContractAddress as `0x${string}`,
    functionName: "claimableRewards",
    args: [address as `0x${string}`],
    chainId, // Specify chainId
  });
};
