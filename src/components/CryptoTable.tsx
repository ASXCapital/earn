import React, { useEffect, useState } from "react";
import styles from "./CryptoTable.module.css"; // Ensure the path is correct
import CoinGeckoWidget from "../utils/CoinGeckoWidget";

interface CryptoTableProps {
  className?: string; // Make className an optional prop
}

interface Coin {
  id: string;
  symbol: string;
}

const CryptoTable: React.FC<CryptoTableProps> = ({ className }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [coinMap, setCoinMap] = useState<{ [key: string]: string }>({});
  const [highestPrice, setHighestPrice] = useState<number>(0);
  const [lowestPrice, setLowestPrice] = useState<number>(Infinity);

  useEffect(() => {
    const loadCoinList = async () => {
      const response = await fetch("/info/CoinList.json");
      const coinList: Coin[] = await response.json();
      const map: { [key: string]: string } = {};
      coinList.forEach((coin) => {
        map[coin.id] = coin.symbol.toUpperCase();
      });
      setCoinMap(map);
    };

    loadCoinList();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const url =
        "https://pro-api.coingecko.com/api/v3/coins/id/contract/0xebd3619642d78f0c98c84f6fa9a678653fb5a99b";
      const options = {
        method: "GET",
        headers: { "x-cg-pro-api-key": process.env.NEXT_PUBLIC_CG_API },
      };

      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const jsonResponse = await response.json();

        // Find highest and lowest prices
        const prices = jsonResponse.tickers.map(
          (ticker: any) => ticker.converted_last.usd,
        );
        setHighestPrice(Math.max(...prices));
        setLowestPrice(Math.min(...prices));

        setData(jsonResponse);
        setIsLoading(false);
      } catch (error) {
        console.error("Fetching data failed:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPriceStyle = (price: number) => {
    if (price === highestPrice) return { color: "lime" };
    if (price === lowestPrice) return { color: "red" };
    return {};
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!data || !data.tickers) {
    return <p>No data available.</p>;
  }

  return (
    <div className={styles.cryptoTableContainer}>
      <div className={styles.cryptoTableHeader2}>
        <h2 className={styles.cryptoTableHeader}>{data.name} Markets</h2>
      </div>
      <CoinGeckoWidget />
      <div className="scrollContainer">
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
            {data.tickers.map((ticker: any, index: number) => (
              <tr key={index}>
                <td>{ticker.market.name}</td>
                <td>
                  <a
                    className={styles.pairColumn}
                    href={ticker.trade_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {`${ticker.base.includes("0X") ? coinMap[ticker.coin_id] || ticker.base : ticker.base}/${ticker.target.includes("0X") ? coinMap[ticker.target_coin_id] || ticker.target : ticker.target}`}
                  </a>
                </td>
                <td
                  className={styles.priceColumn}
                  style={getPriceStyle(ticker.converted_last.usd)}
                >
                  ${ticker.converted_last.usd.toFixed(4)}
                </td>
                <td className={styles.spreadColumn}>
                  {ticker.bid_ask_spread_percentage.toFixed(2)}%
                </td>
                <td className={styles.volumeColumn}>
                  ${ticker.converted_volume.usd.toFixed(2)}
                </td>
                <td className={styles.volumePercentColumn}>
                  {(
                    (ticker.converted_volume.usd /
                      data.market_data.total_volume.usd) *
                    100
                  ).toFixed(2)}
                  %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CryptoTable;
