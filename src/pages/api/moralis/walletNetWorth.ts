// src/pages/api/moralis/walletNetWorth.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query; // Assuming you pass the address as a query parameter

  try {
    // Construct the Moralis API URL
    const url = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/net-worth?chains%5B0%5D=eth&chains%5B1%5D=bsc&chains%5B2%5D=polygon&chains%5B3%5D=base&chains%5B4%5D=optimism&chains%5B5%5D=arbitrum&chains%5B6%5D=avalanche&chains%5B7%5D=fantom&exclude_spam=true&exclude_unverified_contracts=true`;

    const moralisResponse = await fetch(url, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_MORALIS_API, // Use your Moralis API key
        'Accept': 'application/json',
        
      },
      
    });

    if (!moralisResponse.ok) {
      throw new Error('Failed to fetch from Moralis');
    }

    const data = await moralisResponse.json();
    res.status(200).json(data); // Send back the data from Moralis to the frontend
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
