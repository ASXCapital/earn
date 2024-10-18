import { useEffect, useState } from "react";
import { PublicClient } from "viem";

const useLPReserves = (lpContractAddress: `0x${string}`, publicClient: PublicClient, abi: any) => {
  const [reserves, setReserves] = useState({
    reserve0: BigInt(0),
    reserve1: BigInt(0),
    token0: "",
    token1: "",
  });

  useEffect(() => {
    const fetchReserves = async () => {
      try {
        // Use the passed ABI to read the contract data
        const reservesData = await publicClient.readContract({
          address: lpContractAddress,
          abi: abi, // Use ABI passed from the pools config
          functionName: "getReserves",
          args: [],
        });

        const token0Data = await publicClient.readContract({
          address: lpContractAddress,
          abi: abi,
          functionName: "token0",
          args: [],
        });

        const token1Data = await publicClient.readContract({
          address: lpContractAddress,
          abi: abi,
          functionName: "token1",
          args: [],
        });

        setReserves({
          reserve0: reservesData[0],
          reserve1: reservesData[1],
          token0: token0Data as string,
          token1: token1Data as string,
        });
      } catch (error) {
        console.error("Failed to fetch LP reserves:", error);
      }
    };

    fetchReserves();
  }, [lpContractAddress, publicClient, abi]);

  return reserves;
};

export default useLPReserves;
