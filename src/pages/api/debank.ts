import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Define the cache object
interface Cache {
    data: any | null; // Use more specific typing based on the Debank API response if needed
    timestamp: number;
    cacheDuration: number;
}

let cache: Cache = {
    data: null,
    timestamp: 0,
    cacheDuration: 60 * 60 * 1000, // Cache duration: 1 hour
};

// API handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { DEBANK_API_KEY, LP_TRACKING_ADDRESS } = process.env;

    if (!DEBANK_API_KEY || !LP_TRACKING_ADDRESS) {
        return res.status(500).json({ error: 'Missing API key or wallet address in environment variables' });
    }

    try {
        // Check if cached data is still valid
        if (!cache.data || Date.now() - cache.timestamp > cache.cacheDuration) {
            const response = await axios.get(
                `https://pro-openapi.debank.com/v1/user/all_complex_protocol_list?id=${LP_TRACKING_ADDRESS}`,
                {
                    headers: { 'AccessKey': DEBANK_API_KEY },
                }
            );

            // Update cache
            cache.data = response.data;
            cache.timestamp = Date.now();
        }

        // Send cached data to the client
        res.status(200).json(cache.data);
    } catch (error) {
        console.error('Error fetching data from Debank:', error);
        res.status(500).json({ error: 'Failed to fetch data from Debank' });
    }
}
