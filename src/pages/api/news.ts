// File: pages/api/news.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { AINews } from '@chaingpt/ainews';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const apiKey = process.env.CHAINGPT_API_KEY;
    if (!apiKey) {
        return res.status(403).json({ error: 'API Key is missing' });
    }

    const ainews = new AINews({ apiKey });
    const { categoryId, subCategoryId } = req.query;
    const options = {
        limit: 10,
        offset: 0,
        ...(categoryId && { categoryId: [parseInt(categoryId as string, 10)] }),
        ...(subCategoryId && { subCategoryId: [parseInt(subCategoryId as string, 10)] })
    };

    try {
        const response = await ainews.getNews(options);
        // Ensure response is always an array
        const newsData = Array.isArray(response.data.rows) ? response.data.rows : [];
        res.status(200).json(newsData);
    } catch (error) {
        console.error('Failed to fetch news:', error);
        res.status(500).json({ error: 'Failed to fetch news', details: error.message });
    }
}
