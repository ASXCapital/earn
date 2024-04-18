// src/hooks/useTokenBalance.ts
import { useReadContract } from "wagmi";
import { ERC20ABI } from "../abis/ERC20ABI"; // Import your token ABI

export const useTokenBalance = (
  tokenContractAddress: string,
  userAddress: string,
) => {
  return useReadContract({
    abi: ERC20ABI,
    address: tokenContractAddress as `0x${string}`, // Type assertion here
    functionName: "balanceOf",
    args: [userAddress as `0x${string}`], // Type assertion here
  });
};
