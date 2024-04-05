import { useReadContract } from 'wagmi';
import { ASXStakingABI } from '../abis/ASXStakingABI';
import { useEffect, useState } from 'react';

export const useTotalStaked = (contractAddress) => {
  const [isLoading, setIsLoading] = useState(true);

  // Using `useReadContract` to get the total supply from the staking contract
  const { data: totalStaked, isError, isLoading: isReadContractLoading } = useReadContract({
    address: contractAddress, // The contract address
    abi: ASXStakingABI, // The contract ABI
    functionName: 'totalSupply', // The function name to call
  });

  useEffect(() => {
    setIsLoading(isReadContractLoading);
  }, [isReadContractLoading]);

  return { totalStaked, isLoading, isError };
};
