// src/hooks/useTotalSupply.ts
import { useReadContract } from 'wagmi';
import { PancakeV2LPABI } from '../abis/PancakeV2LPABI';

export const useTotalSupply = (lpContractAddress: string) => {
  return useReadContract({
    address: lpContractAddress as `0x${string}`, 
    abi: PancakeV2LPABI,
    functionName: 'totalSupply',
  });
  
};

