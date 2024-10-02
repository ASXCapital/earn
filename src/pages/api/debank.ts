// src/pages/api/debank.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { cache } from './updateCache'; // Import the exported cache

const handler = (req: NextApiRequest, res: NextApiResponse) => {
    if (cache.data) {
        res.status(200).json(cache.data);
    } else {
        res.status(500).json({ error: 'No data available in cache' });
    }
};

export default handler;
