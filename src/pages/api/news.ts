import { NextApiRequest, NextApiResponse } from 'next';
import { AINews } from '@chaingpt/ainews';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { categoryId, subCategoryId, tokenId, searchQuery, fetchAfter, limit } = req.query;

        // Initialize AINews SDK
        const ainews = new AINews({
            apiKey: process.env.CHAINGPT_API_KEY!,
        });

        // Fetch the news with the provided query parameters
        const response = await ainews.getNews({
            categoryId: categoryId ? [Number(categoryId)] : undefined,
            subCategoryId: subCategoryId ? [Number(subCategoryId)] : undefined,
            tokenId: tokenId ? [Number(tokenId)] : undefined,
            searchQuery: searchQuery as string || undefined,
            fetchAfter: fetchAfter ? new Date(fetchAfter as string) : undefined,
            limit: limit ? Number(limit) : 3, // Default to 10 articles if no limit is provided
        });

        // Log the full response to inspect structure
        console.log('AINews API Response:', JSON.stringify(response, null, 2));

        // Check the response structure and send the appropriate data
        if (response?.statusCode === 200 && Array.isArray(response.data)) {
            res.status(200).json(response.data); // Send the data array directly
        } else {
            console.error('Unexpected response format:', response);
            res.status(500).json({ error: 'Unexpected response format from AI News API.' });
        }
    } catch (error) {
        console.error('Error fetching AI news:', (error as Error).message, (error as Error).stack);
        res.status(500).json({ error: `Failed to fetch AI news: ${(error as Error).message}` });
    }
};

export default handler;
