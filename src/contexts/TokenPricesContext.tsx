import React, { createContext, useContext, useEffect, useState } from "react";
import useTokenPrices from "../hooks/useTokenPrices";
import poolsConfig from "../config/poolsConfig"; // Adjust the import path as necessary
import { contracts } from "../config/contracts"; // Assuming you have the contracts info here

const TokenPricesContext = createContext(null);

export const TokenPricesProvider = ({ children }) => {
  // Default platform ID for BSC; this will change dynamically
  const [platformId, setPlatformId] = useState("binance-smart-chain");

  // Create a dynamic set of contract addresses across multiple platforms
  const contractAddresses = Array.from(
    new Set(
      poolsConfig.flatMap((pool) => {
        // For LP tokens, include their constituents' addresses
        if (pool.type === "lp" && pool.stakingToken.constituents) {
          return [
            pool.stakingToken.constituents.token1.address,
            pool.stakingToken.constituents.token2.address,
            pool.rewardToken.address, // Include the reward token for LP pools as well
          ];
        } else {
          // For non-LP tokens, include staking and reward token addresses
          const stakingTokenAddress = pool.stakingToken.address.toLowerCase();
          const rewardTokenAddress = pool.rewardToken.address.toLowerCase();

          // Check if the token is a Core token and map it to its BSC equivalent
          const mappedStakingToken = contracts.coreTokens.ASXcore.toLowerCase() === stakingTokenAddress
            ? contracts.bscTokens.ASX.toLowerCase()
            : stakingTokenAddress;

          const mappedRewardToken = contracts.coreTokens.ASXcore.toLowerCase() === rewardTokenAddress
            ? contracts.bscTokens.ASX.toLowerCase()
            : rewardTokenAddress;

          return [mappedStakingToken, mappedRewardToken];
        }
      })
    )
  );


  // Dynamically detect the platform based on the chainId in poolsConfig
  useEffect(() => {
    const activeChainId = poolsConfig[0]?.chainId; // Assuming the first pool defines the active chain
    if (activeChainId === 1116) {
      setPlatformId("core-dao"); // Core network
    } else if (activeChainId === 56) {
      setPlatformId("binance-smart-chain"); // BSC
    }
    // Add more chains/platforms here as needed
  }, []);

  // Fetch prices for the specific platform and contract addresses
  const fetchedPrices = useTokenPrices(platformId, contractAddresses);

  const [prices, setPrices] = useState({});

  useEffect(() => {
    setPrices(fetchedPrices);
  }, [fetchedPrices]);

  return (
    <TokenPricesContext.Provider value={prices}>
      {children}
    </TokenPricesContext.Provider>
  );
};

export const useTokenPricesContext = () => useContext(TokenPricesContext);
