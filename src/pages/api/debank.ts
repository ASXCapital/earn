// src/pages/api/debank.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { cache, fetchDataFromDebank } from './updateCache'; // Correct import syntax

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Check if the cache is empty
        if (!cache.data) {
            console.log('Cache is empty. Fetching data...');
            await fetchDataFromDebank();
        }

        // After attempting to fetch, check again
        if (!cache.data) {
            return res.status(500).json({ error: 'Cache is still empty. Failed to fetch data.' });
        }

        // Return the cached data
        res.status(200).json(cache.data);
    } catch (error) {
        console.error('Error in /api/debank:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
