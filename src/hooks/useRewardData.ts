import { useEffect, useState } from "react";
import { PublicClient } from "viem";

interface RewardData {
  rewardRate: bigint;
  periodFinish: bigint;
}

export const useRewardData = (
  stakingContractAddress: `0x${string}`,
  rewardTokenAddress: `0x${string}`,
  publicClient: PublicClient,
  abi: any // Type can be improved based on actual ABI structure
) => {
  const [rewardData, setRewardData] = useState<RewardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRewardData = async () => {
      try {
        setIsLoading(true);
        const data = await publicClient.readContract({
          address: stakingContractAddress,
          abi: abi,
          functionName: "rewardData",
          args: [rewardTokenAddress], // Ensure args is an array
        });

        // Assuming the rewardRate is the second item and periodFinish is the first
        setRewardData({
          rewardRate: data[1],
          periodFinish: data[0],
        });
      } catch (error) {
        console.error("Error fetching reward data:", error);
        setError("Error fetching reward data");
      } finally {
        setIsLoading(false);
      }
    };

    if (stakingContractAddress && rewardTokenAddress && publicClient && abi) {
      fetchRewardData();
    }
  }, [stakingContractAddress, rewardTokenAddress, publicClient, abi]);

  return { rewardData, error, isLoading };
};
