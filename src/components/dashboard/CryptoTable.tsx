import React, { useEffect, useState } from "react";
import styles from "./CryptoTable.module.css";
import CoinGeckoWidget from "../../utils/CoinGeckoWidget";

interface CryptoTableProps {
  className?: string;
}

interface Coin {
  id: string;
  symbol: string;
}

interface SortState {
  column: string;
  direction: "ascending" | "descending";
}

const CryptoTable: React.FC<CryptoTableProps> = ({ className }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [coinMap, setCoinMap] = useState<{ [key: string]: string }>({});
  const [highestPrice, setHighestPrice] = useState<number>(0);
  const [lowestPrice, setLowestPrice] = useState<number>(Infinity);
  const [sortState, setSortState] = useState<SortState>({ column: "", direction: "ascending" });
  const [isContentVisible, setIsContentVisible] = useState<boolean>(false);

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
      const url = "https://pro-api.coingecko.com/api/v3/coins/id/contract/0xebd3619642d78f0c98c84f6fa9a678653fb5a99b";
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
        const prices = jsonResponse.tickers.map((ticker: any) => ticker.converted_last.usd);
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

  const handleSort = (columnName: string) => {
    const isNumericColumn = columnName === "price" || columnName === "volume" || columnName === "volumePercent" || columnName === "spread";
    const toggleDirection = sortState.direction === "ascending" ? "descending" : "ascending";
    setSortState({
      column: columnName,
      direction: toggleDirection,
    });
    setData({
      ...data,
      tickers: data.tickers.sort((a: any, b: any) => {
        let aValue = a[columnName];
        let bValue = b[columnName];

        if (columnName === "exchange") {
          aValue = a.market.name.toLowerCase();
          bValue = b.market.name.toLowerCase();
        } else if (columnName === "pair") {
          aValue = a.base + '/' + a.target;
          bValue = b.base + '/' + b.target;
        } else if (columnName === "price") {
          aValue = a.converted_last.usd;
          bValue = b.converted_last.usd;
        } else if (columnName === "volume" || columnName === "volumePercent") {
          aValue = a.converted_volume.usd;
          bValue = b.converted_volume.usd;
          if (columnName === "volumePercent") {
            aValue /= data.market_data.total_volume.usd;
            bValue /= data.market_data.total_volume.usd;
          }
        } else if (columnName === "spread") {
          aValue = a.bid_ask_spread_percentage;
          bValue = b.bid_ask_spread_percentage;
        }

        if (isNumericColumn) {
          return toggleDirection === "ascending" ? aValue - bValue : bValue - aValue;
        } else {
          return toggleDirection === "ascending" ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
        }
      }),
    });
  };

  const renderArrow = (columnName: string) => {
    const arrowType = sortState.column === columnName ? (sortState.direction === "ascending" ? "↓" : "↑") : "↕";
    return arrowType;
  };

  const getPriceStyle = (price: number) => {
    if (price === highestPrice) return { color: "lime" };
    if (price === lowestPrice) return { color: "red" };
    return {};
  };

  const toggleContentVisibility = () => {
    setIsContentVisible(!isContentVisible);
  };

  return (
    <div className={styles.cryptoTableContainer}>
      <div className={styles.cryptoTableHeader2} onClick={toggleContentVisibility}>
        <div className={styles.headerContent}>
          <h2 className={styles.cryptoTableHeader}>ASX Markets</h2>
          <div className={styles.subTitle}>Prices of ASX accross different LPs</div>

          <div className={styles.dropdownArrow}>{isContentVisible ? "▼" : "◀︎"}</div>
        </div>
      </div>
      {isContentVisible && (
        <div>
          <CoinGeckoWidget />
          <div className="scrollContainer">
            <table className={styles.cryptoTable}>
              <thead>
                <tr>
                  <th onClick={() => handleSort("exchange")}>Exchange {renderArrow("exchange")}</th>
                  <th className={styles.pairColumn} onClick={() => handleSort("pair")}>Pair {renderArrow("pair")}</th>
                  <th className={styles.priceColumn} onClick={() => handleSort("price")}>Price {renderArrow("price")}</th>
                  <th className={styles.spreadColumn} onClick={() => handleSort("spread")}>Spread {renderArrow("spread")}</th>
                  <th className={styles.volumeColumn} onClick={() => handleSort("volume")}>24h Volume {renderArrow("volume")}</th>
                  <th className={styles.volumePercentColumn} onClick={() => handleSort("volumePercent")}>Volume % {renderArrow("volumePercent")}</th>
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
      )}
    </div>
  );
};

export default CryptoTable;
