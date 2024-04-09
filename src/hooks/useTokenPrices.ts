//file: src/hooks/useTokenPrices.ts

// Cache structure: { [address: string]: { price: number, timestamp: number } }
import axios from 'axios';
import { useState, useEffect } from 'react';


const CACHE_DURATION = 500 * 1000; // 1 minute

let pricesCache = {};

const useTokenPrices = (platformId, contractAddresses) => {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const fetchPrices = async () => {
      const freshPrices = {};
      const addressesToFetch = [];

      // Determine which addresses need fresh data
      contractAddresses.forEach(address => {
        const cached = pricesCache[address];
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          freshPrices[address] = cached.price;
        } else {
          addressesToFetch.push(address);
        }
      });

      // Fetch fresh data for addresses not in cache or with stale data
      if (addressesToFetch.length > 0) {
        const addressesParam = addressesToFetch.join(',');

        const url = `https://pro-api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${addressesParam}&vs_currencies=usd`;

        try {
          const response = await axios.get(url, { headers: { 'x-cg-pro-api-key': process.env.NEXT_PUBLIC_CG_API } });
         

          Object.entries(response.data).forEach(([address, data]: [string, any]) => {
            const price = data.usd;
            freshPrices[address] = price;
            // Update cache
            pricesCache[address] = { price, timestamp: Date.now() };
          });

        } catch (error) {
          console.error('Failed to fetch token prices:', error);
        }
      }

      // Update state with fresh and cached prices
      setPrices(freshPrices);
    };

    if (contractAddresses.length > 0) {
      fetchPrices();
    }
  }, [platformId, contractAddresses.join(','), CACHE_DURATION]);

  return prices;
};

export default useTokenPrices;
