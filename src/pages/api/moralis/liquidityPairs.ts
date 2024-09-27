// file: /pages/api/moralis/liquidityPairs.ts

import { NextApiRequest, NextApiResponse } from 'next';

const ASX_TOKEN_ADDRESS = '0xebd3619642d78f0c98c84f6fa9a678653fb5a99b'; // ASX token address in lowercase
const BSC_CHAIN = '0x38'; // Binance Smart Chain ID
const EXCHANGE = 'pancakeswapv2';
const TO_BLOCK = 'latest';

// List of token addresses to check for pairs with ASX
const TOKEN_ADDRESSES = [
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', // WBNB (Wrapped BNB)
    // BTCB Token (Bitcoin BEP20)
    '0x7130d2a12b9cbfae4f2634d864a1ee1ce3ead9c',

    // ETH Token (Ethereum BEP20)
    '0x2170ed0880ac9a755fd29b2688956bd959f933f8',

    //TRX
    '0xCE7de646e7208a4Ef112cb6ed5038FA6cC6b12e3',

    //four
    '0x21fd16cd0ef24a49d28429921e335bb0c1bfadb3',

    //CAT
    '0x6894cde390a3f51155ea41ed24a33a4827d3063d',

    //XVS
    '0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63',

    //XRP
    '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe',
    //USDC
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',

    //AAVE
    '0xfb6115445bff7b52feb98650c87f44907e58f802',
    //CGPT
    '0x9840652dc04fb9db2c43853633f0f62be6f00f98',

    // WSTETH
    '0x26c5e01524d2e6280a48f2c50ff6de7e52e9611c',
    // USDT Token (Tether USD)
    '0x55d398326f99059ff775485246999027b3197955',

    // USDC Token (USD Coin)
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',

    // CAKE Token (PancakeSwap)
    '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',

    // LINK Token (ChainLink BEP20)
    // '0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd',

    // TWT Token (Trust Wallet Token)
    '0x4b0f1812e5df2a09796481ff14017e6005508003',

    // LTC Token (Litecoin BEP20)
    '0x4338665cbb7b2485a8855a139b75d5e34ab0db94',

    // XRP Token (Ripple BEP20)
    '0x1d2f0da169ceb9fc7e9c6a9a0b6857deb8b6e41',

    // ADA Token (Cardano BEP20)
    '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47',

    //DOGE
    '0xba2ae424d960c26247dd6c32edc70b295c744c43',

    //BABYDOGE
    '0xc748673057861a797275cd8a068abb95a902e8de',

    //CAKE
    '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',

    //USDT
    '0x55d398326f99059ff775485246999027b3197955',

    // UNI Token (Uniswap BEP20)
    '0xbf5140a22578168fd562dccf235e5d43a02ce9b1',

    // SUSHI Token (SushiSwap BEP20)
    '0x947950bcc74888a40ffa2593c5798f11fc9124c4',

    // SOL Token (Solana BEP20)
    '0x570a5d26f7765ecb712c0924e4de545b89fd43df',
];

type PairData = {
    pairAddress: string;
    token0: {
        address: string;
        symbol: string;
        name: string;
    };
    token1: {
        address: string;
        symbol: string;
        name: string;
    };
    reserve0: string;
    reserve1: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const pairs: PairData[] = [];

        for (const tokenAddress of TOKEN_ADDRESSES) {
            // Get the pair address using the correct endpoint and include 'exchange' parameter
            const pairAddressUrl = `https://deep-index.moralis.io/api/v2.2/${ASX_TOKEN_ADDRESS}/${tokenAddress}/pairAddress?chain=${BSC_CHAIN}&exchange=${EXCHANGE}`;
            console.log(`Fetching pair address from: ${pairAddressUrl}`);

            const pairAddressResponse = await fetch(pairAddressUrl, {
                headers: {
                    'X-API-Key': process.env.MORALIS_API_KEY!,
                    accept: 'application/json',
                },
            });

            if (!pairAddressResponse.ok) {
                console.error(
                    `Error fetching pair address for tokens ${ASX_TOKEN_ADDRESS} and ${tokenAddress}: ${pairAddressResponse.statusText}`
                );
                continue; // Skip to the next token
            }

            const pairAddressData = await pairAddressResponse.json();
            const pairAddress = pairAddressData.pairAddress;

            if (!pairAddress) {
                console.log(
                    `No pair address found for ${ASX_TOKEN_ADDRESS} and ${tokenAddress}`
                );
                continue; // Skip if no pair address
            }

            // Get the reserves for the pair using the correct endpoint and include 'exchange' parameter
            const reservesUrl = `https://deep-index.moralis.io/api/v2.2/${pairAddress}/reserves?chain=${BSC_CHAIN}&exchange=${EXCHANGE}`;
            console.log(`Fetching reserves from: ${reservesUrl}`);

            const reservesResponse = await fetch(reservesUrl, {
                headers: {
                    'X-API-Key': process.env.MORALIS_API_KEY!,
                    accept: 'application/json',
                },
            });

            if (!reservesResponse.ok) {
                console.error(
                    `Error fetching reserves for pair ${pairAddress}: ${reservesResponse.statusText}`
                );
                continue; // Skip to the next token
            }

            const reservesData = await reservesResponse.json();

            // Use token0 and token1 from the pairAddressData
            const token0Data = pairAddressData.token0;
            const token1Data = pairAddressData.token1;

            pairs.push({
                pairAddress,
                token0: {
                    address: token0Data.address,
                    symbol: token0Data.symbol,
                    name: token0Data.name,
                },
                token1: {
                    address: token1Data.address,
                    symbol: token1Data.symbol,
                    name: token1Data.name,
                },
                reserve0: reservesData.reserve0,
                reserve1: reservesData.reserve1,
            });
        }

        res.status(200).json(pairs);
    } catch (error: any) {
        console.error('Error in liquidityPairs API:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}