import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { PancakeV2LPABI } from "../abis/PancakeV2LPABI";

const useLPReserves = (lpContractAddress: string) => {
  const [reserves, setReserves] = useState({
    reserve0: BigInt(0),
    reserve1: BigInt(0),
    token0: "",
    token1: "",
  });
  // Fetching reserves
  const {
    data: reservesData,
    isError: reservesError,
    isLoading: reservesLoading,
  } = useReadContract({
    address: lpContractAddress as `0x${string}`,
    abi: PancakeV2LPABI,
    functionName: "getReserves",
  });

  // Fetching token0 address
  const { data: token0Data } = useReadContract({
    address: lpContractAddress as `0x${string}`,
    abi: PancakeV2LPABI,
    functionName: "token0",
  });

  // Fetching token1 address
  const { data: token1Data } = useReadContract({
    address: lpContractAddress as `0x${string}`,
    abi: PancakeV2LPABI,
    functionName: "token1",
  });

  useEffect(() => {
    if (
      reservesData &&
      !reservesError &&
      !reservesLoading &&
      token0Data &&
      token1Data
    ) {
      // Update reserves state with the new data including token addresses
      setReserves({
        reserve0: reservesData[0],
        reserve1: reservesData[1],
        token0: token0Data,
        token1: token1Data,
      });
    }
  }, [reservesData, reservesError, reservesLoading, token0Data, token1Data]);

  return reserves;
};

export default useLPReserves;
