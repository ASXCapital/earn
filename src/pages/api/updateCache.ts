// src/pages/api/updateCache.ts
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { contracts } from '../../config/contracts';

export let cache: { data: any | null; timestamp: number } = {
    data: null,
    timestamp: 0,
};

const fetchDataFromDebank = async () => {
    const { DEBANK_API_KEY, LP_TRACKING_ADDRESS } = process.env;

    if (!DEBANK_API_KEY || !LP_TRACKING_ADDRESS) {
        console.error('Missing API key or wallet address in environment variables');
        return null;
    }

    const stakingAddresses = Object.values(contracts.bscStaking);

    try {
        // Fetch data for the main wallet address
        console.log('Fetching data for main wallet...');
        const mainWalletResponse = await axios.get(
            `https://pro-openapi.debank.com/v1/user/all_complex_protocol_list?id=${LP_TRACKING_ADDRESS}`,
            {
                headers: { 'AccessKey': DEBANK_API_KEY },
            }
        );
        console.log('Main wallet data fetched successfully.');

        // Fetch data for each staking address
        console.log('Fetching data for staking addresses...');
        const stakedLPsResponses = await Promise.all(
            stakingAddresses.map((address) =>
                axios.get(`https://pro-openapi.debank.com/v1/user/all_complex_protocol_list?id=${address}`, {
                    headers: { 'AccessKey': DEBANK_API_KEY },
                })
            )
        );
        console.log('Staking addresses data fetched successfully.');

        // Flatten and filter the data
        const filteredStakedData = stakedLPsResponses.filter((response) => response.status === 200).map((res) => res.data);

        // Update cache
        cache = {
            data: {
                mainWallet: mainWalletResponse.data,
                stakedLPs: filteredStakedData.flat(),
            },
            timestamp: Date.now(),
        };
        console.log('Cache updated successfully.');

        return cache.data;
    } catch (error) {
        console.error('Error fetching data from Debank:', error);
        return null;
    }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    // Fetch new data and update the cache
    const data = await fetchDataFromDebank();
    if (data) {
        res.status(200).json(data);
    } else {
        res.status(500).json({ error: 'Failed to update cache' });
    }
};

export default handler;
