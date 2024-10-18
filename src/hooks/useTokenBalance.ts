// file: src/hooks/useTokenBalance.ts

import { useReadContract } from "wagmi";
import { ERC20ABI } from "../abis/ERC20ABI"; // Import your token ABI

export const useTokenBalance = (
  tokenContractAddress: string,
  userAddress?: string,
  chainId?: number, // Add chainId parameter
) => {
  const address =
    userAddress || "0x0000000000000000000000000000000000000000"; // Use zero address if userAddress is not available
  return useReadContract({
    abi: ERC20ABI,
    address: tokenContractAddress as `0x${string}`,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    chainId, // Specify chainId
  });
};
