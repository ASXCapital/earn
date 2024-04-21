import { NextApiRequest, NextApiResponse } from "next";

// Define a cache object to store the fetched data
let cache: { [key: string]: { timestamp: number; data: any } } = {};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const {
        address,
        chain,
        exclude_spam,
        exclude_unverified_contracts,
        exclude_native
    } = req.query;

    const cacheKey = JSON.stringify(req.query);

    try {
        // Check if data exists in cache and is not older than 5 minutes
        if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < 5 * 60 * 1000) {
            return res.status(200).json(cache[cacheKey].data);
        }

        const queryParams = new URLSearchParams({
            chain: Array.isArray(chain) ? chain[0] : chain, // Ensure chain is a string
            exclude_spam: Array.isArray(exclude_spam) ? exclude_spam[0] : exclude_spam, // Ensure exclude_spam is a string
            exclude_unverified_contracts: Array.isArray(exclude_unverified_contracts) ? exclude_unverified_contracts[0] : exclude_unverified_contracts, // Ensure exclude_unverified_contracts is a string
            exclude_native: Array.isArray(exclude_native) ? exclude_native[0] : exclude_native, // Ensure exclude_native is a string
        }).toString();

        const url = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens?${queryParams}`;

        const moralisResponse = await fetch(url, {
            headers: {
                "X-API-Key": process.env.NEXT_PUBLIC_MORALIS_API,
                Accept: "application/json",
            },
        });

        if (!moralisResponse.ok) {
            throw new Error(`Failed to fetch from Moralis: ${moralisResponse.statusText}`);
        }

        const data = await moralisResponse.json();

        // Update cache with new data
        cache[cacheKey] = {
            timestamp: Date.now(),
            data: data
        };

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
