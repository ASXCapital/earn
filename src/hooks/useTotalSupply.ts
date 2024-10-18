import { useEffect, useState } from "react";
import { PublicClient } from "viem";

export const useTotalSupply = (
  lpContractAddress: `0x${string}`,
  publicClient: PublicClient,
  abi: any // Accept ABI as a parameter
) => {
  const [data, setData] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchTotalSupply = async () => {
      try {
        setIsLoading(true);
        setIsError(false);

        const result = await publicClient.readContract({
          address: lpContractAddress,
          abi: abi,
          functionName: "totalSupply",
          args: []
        });

        setData(result as bigint);
      } catch (error) {
        console.error("Error fetching total supply:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (lpContractAddress && publicClient) {
      fetchTotalSupply();
    }
  }, [lpContractAddress, publicClient, abi]);

  return { data, isLoading, isError };
};
