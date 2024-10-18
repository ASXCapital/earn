import axios from "axios";
import { useState, useEffect } from "react";
import { contracts } from "../config/contracts"; // Import contracts

const CACHE_DURATION = 60 * 1000; // 1 minute

let pricesCache = {};

const useTokenPrices = (platformId: string, contractAddresses: string[]) => {
  const [prices, setPrices] = useState<{ [address: string]: number }>({});

  useEffect(() => {
    const fetchPrices = async () => {
      const freshPrices: { [address: string]: number } = {};
      const addressesToFetch: string[] = [];

      // Map core token addresses to their BSC equivalents if needed
      const mappedAddresses = contractAddresses.map((address) => {
        const lowercasedAddress = address.toLowerCase();

        // If the address is a Core token, replace it with its BSC equivalent
        if (contracts.coreTokens.ASXcore.toLowerCase() === lowercasedAddress) {
          return contracts.bscTokens.ASX.toLowerCase(); // Map to BSC ASX token
        }

        return lowercasedAddress; // Default to the original address
      });


      // Determine which addresses need fresh data
      mappedAddresses.forEach((address) => {
        const cached = pricesCache[address];
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          freshPrices[address] = cached.price;
        } else {
          addressesToFetch.push(address);
        }
      });

      // Fetch fresh data for addresses not in cache or with stale data
      if (addressesToFetch.length > 0) {
        const addressesParam = addressesToFetch.join(",");

        const url = `https://pro-api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${addressesParam}&vs_currencies=usd`;

        try {
          const response = await axios.get(url, {
            headers: { "x-cg-pro-api-key": process.env.NEXT_PUBLIC_CG_API },
          });

          // Track which addresses have been fetched
          const fetchedAddresses = new Set<string>();

          Object.entries(response.data).forEach(
            ([address, data]: [string, any]) => {
              const lowercasedAddress = address.toLowerCase();
              const price = data.usd;
              freshPrices[lowercasedAddress] = price;
              // Update cache
              pricesCache[lowercasedAddress] = { price, timestamp: Date.now() };
              fetchedAddresses.add(lowercasedAddress);
            }
          );

          // For addresses not returned by the API, set price to 0
          addressesToFetch.forEach((address) => {
            if (!fetchedAddresses.has(address)) {
              freshPrices[address] = 0;
              // Update cache
              pricesCache[address] = { price: 0, timestamp: Date.now() };
            }
          });
        } catch (error) {
          console.error("Failed to fetch token prices:", error);
          // In case of error, set price to 0 for all addresses we tried to fetch
          addressesToFetch.forEach((address) => {
            freshPrices[address] = 0;
            pricesCache[address] = { price: 0, timestamp: Date.now() };
          });
        }
      }

      // Merge freshPrices with existing prices
      setPrices((prevPrices) => ({ ...prevPrices, ...freshPrices }));
    };

    if (contractAddresses.length > 0) {
      fetchPrices();
    }
  }, [platformId, contractAddresses.join(","), CACHE_DURATION]);

  return prices;
};

export default useTokenPrices;
