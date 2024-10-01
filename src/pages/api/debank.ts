// src/pages/api/debank.ts
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { contracts } from '../../config/contracts'; // Import contracts configuration

// Define the cache object
interface Cache {
    data: any | null;
    timestamp: number;
}

let cache: Cache = {
    data: null,
    timestamp: 0,
};

const { DEBANK_API_KEY, LP_TRACKING_ADDRESS } = process.env;

// Helper function to fetch data for a single address
const fetchDataForAddress = async (address: string, apiKey: string) => {
    try {
        const response = await axios.get(
            `https://pro-openapi.debank.com/v1/user/all_complex_protocol_list?id=${address}`,
            {
                headers: { 'AccessKey': apiKey },
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching data for address ${address}:`, error);
        return null; // Return null if there's an error
    }
};

// Function to periodically update cache
const updateCache = async () => {
    if (!DEBANK_API_KEY || !LP_TRACKING_ADDRESS) {
        console.error('Missing API key or wallet address in environment variables');
        return;
    }

    const stakingAddresses = Object.values(contracts.bscStaking);

    try {
        // Fetch data for the main wallet address
        const mainWalletData = await fetchDataForAddress(LP_TRACKING_ADDRESS, DEBANK_API_KEY);

        // Fetch data for each staking address individually
        const stakedLPsData = await Promise.all(
            stakingAddresses.map(address => fetchDataForAddress(address, DEBANK_API_KEY))
        );

        // Filter out any null values (in case some requests failed)
        const filteredStakedData = stakedLPsData.filter(data => data !== null);

        // Categorize the data into "mainWallet" and "stakedLPs"
        cache.data = {
            mainWallet: mainWalletData || [], // Store data for LP_TRACKING_ADDRESS
            stakedLPs: filteredStakedData.flat().map(protocol => ({
                ...protocol,
                isStakedLP: true, // Mark these as staked LPs
            })),
        };
        cache.timestamp = Date.now();

    } catch (error) {
        console.error('Error fetching data from Debank:', error);
    }
};

// Set up interval to update cache every second
setInterval(updateCache, 1000);

// API handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (cache.data) {
        res.status(200).json(cache.data);
    } else {
        res.status(500).json({ error: 'No data available in cache' });
    }
}