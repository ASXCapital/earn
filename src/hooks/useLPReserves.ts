// file: src/hooks/useLPReserves.ts

import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { PancakeV2LPABI } from '../abis/PancakeV2LPABI';

const useLPReserves = (lpContractAddress: string) => {
  // Initialize state with 'null' to indicate data is not yet loaded.
  const [reserves, setReserves] = useState({ reserve0: BigInt(0), reserve1: BigInt(0) });

  const { data, isError, isLoading } = useReadContract({
    address: lpContractAddress as `0x${string}`,
    abi: PancakeV2LPABI,
    functionName: 'getReserves',
  });

  useEffect(() => {
    if (data && !isError && !isLoading) {
      // Update reserves state with the new data
      setReserves({ reserve0: data[0], reserve1: data[1] });
    }
  }, [data, isError, isLoading]);

  return reserves;
};

export default useLPReserves;
