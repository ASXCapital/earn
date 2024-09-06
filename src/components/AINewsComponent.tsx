import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import styles from './AINewsComponent.module.css'; // Import CSS module

// Define types for Category, Subcategory, Token, and Article
type Category = {
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
    category?: Category;
    subCategory?: Category;
    token?: Token;
};

export default function AINewsComponent() {
    const [news, setNews] = useState<Article[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>(''); // Title and description search
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(null);
    const [selectedToken, setSelectedToken] = useState<number | null>(null);
    const [fetchAfter, setFetchAfter] = useState<string>(''); // Date-based search
    const [numArticles, setNumArticles] = useState<number>(4); // Number of articles to display

    // Predefined static categories, subcategories, and tokens
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
    ];

    const subCategories: Category[] = [
        { id: 11, name: 'Bitcoin' },
        { id: 12, name: 'BNB Chain' },
        { id: 13, name: 'Celo' },
        { id: 14, name: 'Cosmos' },
        { id: 15, name: 'Ethereum' },
        { id: 16, name: 'Fantom' },
        { id: 17, name: 'Flow' },
        { id: 18, name: 'Litecoin' },
    ];

    const tokens: Token[] = [
        { id: 79, name: 'Bitcoin - BTC' },
        { id: 80, name: 'Ethereum - ETH' },
        { id: 81, name: 'Tether USDt - USDT' },
        { id: 82, name: 'BNB - BNB' },
        { id: 83, name: 'XRP - XRP' },
        { id: 84, name: 'USDC - USDC' },
    ];

    // Fetch news only when "Get News" button is clicked
    const fetchNews = async () => {
        setLoading(true); // Start loading animation
        setNews([]); // Remove old articles from the view
        try {
            const response = await axios.get('/api/news', {
                params: {
                    categoryId: selectedCategory || undefined,
                    subCategoryId: selectedSubCategory || undefined,
                    tokenId: selectedToken || undefined,
                    searchQuery: searchQuery || undefined, // Search keyword included
                    fetchAfter: fetchAfter || undefined,
                    limit: numArticles,
                },
            });

            setNews(response.data); // Set news articles from the response
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false); // End loading animation
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.heading}>AI News</h2>

            {/* Filters */}
            <div className={styles.filters}>
                {/* Category Filter */}
                <label htmlFor="category">Category:</label>
                <select
                    id="category"
                    className={styles.dropdown}
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(Number(e.target.value) || null)}
                >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>

                {/* Subcategory Filter */}
                <label htmlFor="subCategory">Subcategory:</label>
                <select
                    id="subCategory"
                    className={styles.dropdown}
                    value={selectedSubCategory || ''}
                    onChange={(e) => setSelectedSubCategory(Number(e.target.value) || null)}
                >
                    <option value="">All Subcategories</option>
                    {subCategories.map((subCategory) => (
                        <option key={subCategory.id} value={subCategory.id}>
                            {subCategory.name}
                        </option>
                    ))}
                </select>

                {/* Token Filter */}
                <label htmlFor="token">Token:</label>
                <select
                    id="token"
                    className={styles.dropdown}
                    value={selectedToken || ''}
                    onChange={(e) => setSelectedToken(Number(e.target.value) || null)}
                >
                    <option value="">All Tokens</option>
                    {tokens.map((token) => (
                        <option key={token.id} value={token.id}>
                            {token.name}
                        </option>
                    ))}
                </select>

                {/* Date Picker */}
                <label htmlFor="fetchAfter">Fetch After:</label>
                <input
                    type="date"
                    id="fetchAfter"
                    className={styles.dropdown}
                    value={fetchAfter}
                    onChange={(e) => setFetchAfter(e.target.value)}
                />

                {/* Number of Articles */}
                <label htmlFor="numArticles">Number of Articles:</label>
                <select
                    id="numArticles"
                    className={styles.dropdown}
                    value={numArticles}
                    onChange={(e) => setNumArticles(Number(e.target.value))}
                >
                    {[1, 2, 3, 4].map(num => (
                        <option key={num} value={num}>{num} Article(s)</option>
                    ))}
                </select>
            </div>

            {/* Search moved to bottom */}
            <div className={styles.searchContainer}>
                <label htmlFor="searchQuery">Keyword Search:</label>
                <input
                    type="text"
                    id="searchQuery"
                    placeholder="Enter keyword to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
                <button className={styles.searchBtn} onClick={fetchNews}>Search</button>
            </div>

            {/* Loading Animation */}
            {loading && <div className={styles.loadingAnimation}>Loading...</div>}

            {/* News Articles */}
            <div className={styles.newsArticles}>
                {!loading && !error && news.map((article) => (
                    <div key={article.id} className={styles.article}>
                        <h3>{article.title}</h3>
                        <Image
                            src={article.imageUrl}
                            alt={article.title}
                            width={500}
                            height={300}
                            className={styles.articleImage}
                        />
                        <p>{article.description}</p>
                    </div>
                ))}

                {/* Error Handling */}
                {error && <p className={styles.errorMessage}>{error}</p>}
            </div>
        </div>
    );
}
