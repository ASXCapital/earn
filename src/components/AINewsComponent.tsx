import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import styles from './AINewsComponent.module.css'; // Import CSS module

// Define types for Category, Blockchain, Token, and Article
type Category = {
    id: number;
    name: string;
};

type Blockchain = {
    id: number;
    name: string;
};

type Token = {
    id: number;
    name: string;
};

type Article = {
    id: number;
    title: string;
    imageUrl: string;
    description: string;
    pubDate: string;
    category?: Category;
    blockchain?: Blockchain;
    token?: Token;
    author: string;
    viewsCount: number;
};

export default function AINewsComponent() {
    const [news, setNews] = useState<Article[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>(''); // Title and description search
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedBlockchain, setSelectedBlockchain] = useState<number | null>(null);
    const [selectedToken, setSelectedToken] = useState<number | null>(null);

    // Predefined static categories, blockchains, and tokens
    const categories: Category[] = [
        { id: 2, name: 'Blockchain Gaming' },
        { id: 3, name: 'DAO' },
        { id: 4, name: 'DApps' },
        { id: 5, name: 'DeFi' },
        { id: 6, name: 'Lending' },
        { id: 7, name: 'Metaverse' },
        { id: 8, name: 'NFT' },
        { id: 9, name: 'Stablecoins' },
        { id: 64, name: 'Cryptocurrency' },
        { id: 65, name: 'Decentralized' },
        { id: 66, name: 'Smart Contracts' },
        { id: 67, name: 'Distributed Ledger' },
        { id: 68, name: 'Cryptography' },
        { id: 69, name: 'Digital Assets' },
        { id: 70, name: 'Tokenization' },
        { id: 71, name: 'Consensus Mechanisms' },
        { id: 72, name: 'ICO (Initial Coin Offering)' },
        { id: 73, name: 'Crypto Wallets' },
        { id: 74, name: 'Web3.0' },
        { id: 75, name: 'Interoperability' },
        { id: 76, name: 'Mining' },
        { id: 77, name: 'Cross-Chain Transactions' },
        { id: 78, name: 'Exchange' }
    ];

    const blockchains: Blockchain[] = [
        { id: 11, name: 'Bitcoin' },
        { id: 12, name: 'BNB Chain' },
        { id: 13, name: 'Celo' },
        { id: 14, name: 'Cosmos' },
        { id: 15, name: 'Ethereum' },
        { id: 16, name: 'Fantom' },
        { id: 17, name: 'Flow' },
        { id: 18, name: 'Litecoin' },
        { id: 19, name: 'Monero' },
        { id: 20, name: 'Polygon' },
        { id: 21, name: 'XRP Ledger' },
        { id: 22, name: 'Solana' },
        { id: 23, name: 'Tron' },
        { id: 24, name: 'Terra' },
        { id: 25, name: 'Tezos' }
    ];

    const tokens: Token[] = [
        { id: 79, name: 'Bitcoin - BTC' },
        { id: 80, name: 'Ethereum - ETH' },
        { id: 81, name: 'Tether USDt - USDT' },
        { id: 82, name: 'BNB - BNB' },
        { id: 83, name: 'XRP - XRP' },
        { id: 84, name: 'USDC - USDC' },
        { id: 85, name: 'Solana - SOL' },
        { id: 86, name: 'Cardano - ADA' },
        { id: 87, name: 'Dogecoin - DOGE' },
        { id: 88, name: 'TRON - TRX' },
        { id: 89, name: 'Toncoin - TON' }
    ];

    // Shuffle the articles array
    const shuffleArray = (array: Article[]) => {
        return array.sort(() => Math.random() - 0.5);
    };

    // Fetch and set the articles, randomizing their order
    const fetchNews = async () => {
        setLoading(true);
        setNews([]);
        try {
            const response = await axios.get('/api/news', {
                params: {
                    categoryId: selectedCategory || undefined,
                    blockchainId: selectedBlockchain || undefined,
                    tokenId: selectedToken || undefined,
                    searchQuery: searchQuery || undefined,
                    limit: 6 // Automatically load 6 articles
                }
            });
            const shuffledNews = shuffleArray(response.data); // Randomize order
            setNews(shuffledNews);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    // Auto-load articles on page load
    useEffect(() => {
        fetchNews();
    }, []); // Empty dependency array ensures it only runs once on mount

    return (
        <div className={styles.container}>
            <div className={styles.filters}>
                <select
                    id="category"
                    className={styles.dropdown}
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(Number(e.target.value) || null)}
                    title="Category"
                >
                    <option value="">Category</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>

                <select
                    id="blockchain"
                    className={styles.dropdown}
                    value={selectedBlockchain || ''}
                    onChange={(e) => setSelectedBlockchain(Number(e.target.value) || null)}
                    title="Blockchain"
                >
                    <option value="">Blockchain</option>
                    {blockchains.map((blockchain) => (
                        <option key={blockchain.id} value={blockchain.id}>
                            {blockchain.name}
                        </option>
                    ))}
                </select>

                <select
                    id="token"
                    className={styles.dropdown}
                    value={selectedToken || ''}
                    onChange={(e) => setSelectedToken(Number(e.target.value) || null)}
                    title="Token"
                >
                    <option value="">Token</option>
                    {tokens.map((token) => (
                        <option key={token.id} value={token.id}>
                            {token.name}
                        </option>
                    ))}
                </select>

                <input
                    type="text"
                    id="searchQuery"
                    placeholder="Keyword Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
                <button className={styles.searchBtn} onClick={fetchNews}>
                    &nbsp;&nbsp;Search&nbsp;&nbsp;
                </button>

                <div className={styles.poweredBy}>
                    <span>AI News Powered by</span>
                    <Image
                        src="/logos/partners/chaingpt-logoLight-Neon.svg"
                        alt="ChainGPT"
                        width={100}
                        height={50}
                    />
                </div>
            </div>

            {loading && <div className={styles.loadingAnimation}>Loading...</div>}

            <div className={styles.newsArticles}>
                {!loading && !error && news.map((article) => (
                    <div key={article.id} className={styles.article}>
                        {/* Title */}
                        <h2 className={styles.title}>{article.title}</h2>

                        <div className={styles.meta}>
                            <span>{new Date(article.pubDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>

                        {/* Image */}
                        <Image
                            src={article.imageUrl}
                            alt={article.title}
                            width={500}
                            height={300}
                            className={styles.articleImage}
                        />

                        {/* Description */}
                        <p className={styles.description}>{article.description}</p>

                        {/* Category and Chain */}
                        <div className={styles.tags}>
                            {article.category && <span className={styles.tag}>Category: {article.category.name}</span>}
                            {article.blockchain && <span className={styles.tag}>Chain: {article.blockchain.name}</span>}
                        </div>
                    </div>
                ))}
                {error && <p className={styles.errorMessage}>{error}</p>}
            </div>
        </div>
    );
}
