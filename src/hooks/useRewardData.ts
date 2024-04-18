// src/hooks/useRewardData.ts
import { useReadContract } from "wagmi";
import { ASXStakingABI } from "../abis/ASXStakingABI"; // Adjust the import path according to your project structure
import { ethers } from "ethers";

export const useRewardData = (
  stakingContractAddress: string,
  rewardTokenAddress: string,
) => {
  const { data, isError, isLoading } = useReadContract({
    address: stakingContractAddress as `0x${string}`, // Your staking contract address
    abi: ASXStakingABI, // The ABI for your staking contract
    functionName: "rewardData", // The function that returns the reward data
    args: [rewardTokenAddress as `0x${string}`], // The address of the reward token
  });

  // Parsing the returned data into structured reward data
  const rewardData = data
    ? {
        periodFinish: ethers.BigNumber.from(data[0]),
        rewardRate: ethers.BigNumber.from(data[1]),
        lastUpdateTime: ethers.BigNumber.from(data[2]),
        rewardPerTokenStored: ethers.BigNumber.from(data[3]),
      }
    : null;
  // Returning the reward data, error status, and loading status

  return { rewardData, isError, isLoading };
};
