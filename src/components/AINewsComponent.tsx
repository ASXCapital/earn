// File: components/AINewsComponent.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import styles from './AINewsComponent.module.css';

const CATEGORIES = [
    { id: 2, name: 'Blockchain Gaming' },
    { id: 3, name: 'DAO' },
    { id: 4, name: 'DApps' },
    { id: 5, name: 'DeFi' },
    { id: 7, name: 'Metaverse' },
    { id: 8, name: 'NFT' },
    { id: 9, name: 'Stablecoins' },
];

const SUBCATEGORIES = [
    { id: 11, name: 'Bitcoin' },
    { id: 12, name: 'BNB Chain' },
    { id: 15, name: 'Ethereum' },
    { id: 20, name: 'Polygon' },
    { id: 22, name: 'Solana' },
    { id: 23, name: 'Tron' },
];

export default function AINewsComponent() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState(null);
    const [subcategory, setSubcategory] = useState(null);

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            setError(null);
            const url = `/api/news?${category ? `categoryId=${category}&` : ''}${subcategory ? `subCategoryId=${subcategory}` : ''}`;

            try {
                const response = await axios.get(url);
                console.log("API Response:", response.data);  // Debug log
                if (Array.isArray(response.data)) {
                    setNews(response.data);
                } else {
                    throw new Error("Data format is incorrect, expected an array.");
                }
            } catch (err) {
                console.error('Error fetching news:', err);
                setError('Failed to fetch news');
                setNews([]); // Always reset to an array on error.
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [category, subcategory]);

    return (
        <div>
            <h2>AI News</h2>
            <div className={styles.filters}>
                <label htmlFor="categorySelect">Filter by Category:</label>
                <select id="categorySelect" onChange={e => setCategory(e.target.value || null)}>
                    <option value="">All Categories</option>
                    {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <label htmlFor="subcategorySelect">Filter by Subcategory:</label>
                <select id="subcategorySelect" onChange={e => setSubcategory(e.target.value || null)}>
                    <option value="">All Subcategories</option>
                    {SUBCATEGORIES.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                </select>
            </div>
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}
            <div className={styles.newsContainer}>
                {news.map(article => (
                    <div key={article.id} className={styles.newsArticle}>
                        <h3>{article.title}</h3>
                        <div className={styles.imageWrapper}>
                            <Image src={article.imageUrl} alt={article.title} layout="fill" objectFit="cover" />
                        </div>
                        <p>{article.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
