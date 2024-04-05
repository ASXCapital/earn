import React, { useEffect, useState } from 'react';
import styles from './CryptoTable.module.css'; // Make sure the path is correct

interface CryptoTableProps {
    className?: string; // Make className an optional prop
  }

  const CryptoTable: React.FC<CryptoTableProps> = ({ className }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const url = 'https://pro-api.coingecko.com/api/v3/coins/bsc/contract/0xebd3619642d78f0c98c84f6fa9a678653fb5a99b';
      const options = {
        method: 'GET',
        headers: { 'x-cg-pro-api-key': process.env.NEXT_PUBLIC_CG_API }
      };

      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const jsonResponse = await response.json();
        setData(jsonResponse);
        setIsLoading(false);
      } catch (error) {
        console.error('Fetching data failed:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!data || !data.tickers) {
    return <p>No data available.</p>;
  }

  return (
    <div className={className}> 

    <div className={styles.cryptoTableContainer}>
      <h2 className={styles.cryptoTableHeader}>{data.name} Markets</h2>
      <table className={styles.cryptoTable}>
        <thead>
          <tr>
            <th>Exchange</th>
            <th className={styles.pairColumn}>Pair</th>
            <th className={styles.priceColumn}>Price</th>
            <th className={styles.spreadColumn}>Spread</th>
            <th className={styles.volumeColumn}>24h Volume</th>
            <th className={styles.volumePercentColumn}>Volume %</th>
          </tr>
        </thead>
        <tbody>
          {data.tickers.map((ticker, index) => (
            <tr key={index}>
              <td>{ticker.market.name}</td>
              <td>
                <a
                  className={styles.pairColumn}
                  href={`https://pancakeswap.finance/swap?inputCurrency=${ticker.target}&outputCurrency=${ticker.base}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ASX/{ticker.target_coin_id.toUpperCase()}
                </a>
              </td>
              <td className={styles.priceColumn}>${ticker.converted_last.usd.toFixed(4)}</td>
              <td className={styles.spreadColumn}>{ticker.bid_ask_spread_percentage.toFixed(2)}%</td>
              <td className={styles.volumeColumn}>${ticker.converted_volume.usd.toFixed(2)}</td>
              <td className={styles.volumePercentColumn}>{((ticker.converted_volume.usd / data.market_data.total_volume.usd) * 100).toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
};

export default CryptoTable;
