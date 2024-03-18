// Cache structure: { [address: string]: { price: number, timestamp: number } }
import axios from 'axios';
import { useState, useEffect } from 'react';

const CACHE_DURATION = 500 * 1000; // 1 minute

let pricesCache: { [address: string]: { price: number, timestamp: number } } = {};

const useTokenPrices = (platformId: string, contractAddresses: string[]) => {
  const [prices, setPrices] = useState<{ [address: string]: number }>({});

  useEffect(() => {
    const fetchPrices = async () => {
      const freshPrices: { [address: string]: number } = {};
      const addressesToFetch: string[] = [];

      // Determine which addresses need fresh data
      for (const address of contractAddresses) {
        const cached = pricesCache[address];
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          freshPrices[address] = cached.price;
        } else {
          addressesToFetch.push(address);
        }
      }

      // Fetch fresh data for addresses not in cache or with stale data
      if (addressesToFetch.length > 0) {
        const addressesParam = addressesToFetch.join('&contract_addresses=');
        const url = `https://pro-api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${addressesParam}&vs_currencies=usd`;

        try {
          const response = await axios.get(url, { headers: { 'x-cg-pro-api-key': 'CG-53k3YNSaA1CFL65mqZYggmBf' } });

          addressesToFetch.forEach(address => {
            if (response.data[address]) {
              const price = response.data[address].usd;
              freshPrices[address] = price;
              // Update cache
              pricesCache[address] = { price, timestamp: Date.now() };
            }
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
  }, [platformId, contractAddresses.join(','), CACHE_DURATION]); // Also depend on CACHE_DURATION in case it changes

  return prices;
};

export default useTokenPrices;
