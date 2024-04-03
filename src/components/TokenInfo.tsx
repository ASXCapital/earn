import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './TokenInfo.module.css';

const TokenInfo = () => {
    const [tokenData, setTokenData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const options = {
                    method: 'GET',
                    url: 'https://pro-api.coingecko.com/api/v3/coins/bsc/contract/0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B',
                    headers: {'x-cg-pro-api-key': process.env.NEXT_PUBLIC_CG_API_KEY}
                };
                const response = await axios.request(options);
                setTokenData(response.data);
            } catch (error) {
                console.error('Error fetching token data:', error);
            }
        };
        fetchData();
    }, []);

    if (!tokenData) return <div>Loading...</div>;

    const formatPrice = (price) => {
        const parts = price.toFixed(4).toString().split('.');
        const mainPart = parts[0];
        const firstTwoDecimals = parts[1].substring(0, 2);
        const lastTwoDecimals = parts[1].substring(2);
        return (
            <span>
                {mainPart}.<span>{firstTwoDecimals}</span><span className={styles.smallDecimals}>{lastTwoDecimals}</span>
            </span>
        );
    };

    const priceChange = tokenData.market_data.price_change_percentage_24h;
    const priceChangeClass = priceChange < 0 ? styles.red : priceChange > 0 ? styles.green : '';

    return (
        <div className={styles.InfoList}>
            <p className={styles.tokenInfoItem}>${formatPrice(tokenData.market_data.current_price.usd)}</p>
            <p className={styles.tokenInfoItem}>24h Vol: ${tokenData.market_data.total_volume.usd.toFixed(2)}</p>
            <p className={styles.tokenInfoItem}>
                24h:<span className={priceChangeClass}>{priceChange.toFixed(2)}%</span>
                {priceChange !== 0 && (
                    <span className={`${priceChangeClass} ${styles.arrow}`}>
                        {priceChange > 0 ? '\u00A0↑' : '\u00A0↓'}
                    </span>
                )}
            </p>
        </div>
    );
};

export default TokenInfo;
