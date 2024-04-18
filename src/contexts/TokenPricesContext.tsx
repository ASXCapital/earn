import React, { createContext, useContext, useEffect, useState } from "react";
import useTokenPrices from "../hooks/useTokenPrices";
import poolsConfig from "../config/poolsConfig"; // Adjust the import path as necessary

const TokenPricesContext = createContext(null);

export const TokenPricesProvider = ({ children }) => {
  const platformId = "binance-smart-chain";

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
          return [pool.stakingToken.address, pool.rewardToken.address];
        }
      }),
    ),
  );

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
