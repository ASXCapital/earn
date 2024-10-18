// file: src/hooks/useTotalStaked.ts

import { useReadContract } from "wagmi";
import { ASXStakingABI } from "../abis/ASXStakingABI";
import { useEffect, useState } from "react";

export const useTotalStaked = (contractAddress: string, chainId?: number) => {
  const [isLoading, setIsLoading] = useState(true);

  // Using `useReadContract` to get the total supply from the staking contract
  const {
    data: totalStaked,
    isError,
    isLoading: isReadContractLoading,
  } = useReadContract({
    address: contractAddress as `0x${string}`, // The contract address
    abi: ASXStakingABI, // The contract ABI
    functionName: "totalSupply", // The function name to call
    chainId, // Specify chainId
  });

  useEffect(() => {
    setIsLoading(isReadContractLoading);
  }, [isReadContractLoading]);

  return { totalStaked, isLoading, isError };
};
