import React, { useEffect, useState } from "react";
import styles from "./LiquidityPairs.module.css";
import useTokenPrices from "../hooks/useTokenPrices";

interface PairData {
    pairAddress: string;
    token0: { address: string; symbol: string; name: string };
    token1: { address: string; symbol: string; name: string };
    reserve0: string;
    reserve1: string;
}

type AdjustedPairData = Omit<PairData, 'reserve0' | 'reserve1'> & {
    reserve0: number; // Now a number
    reserve1: number; // Now a number
    reserve0Value: number;
    reserve1Value: number;
    lpValue: number;
    pairName: string;
    adjusted: boolean;
};

interface SortState {
    column: string;
    direction: "ascending" | "descending";
}

const convertToDecimal = (amount: string, decimals: number = 18) => {
    return parseFloat(amount) / Math.pow(10, decimals);
};

const LiquidityPairs: React.FC = () => {
    const [pairs, setPairs] = useState<PairData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [sortState, setSortState] = useState<SortState>({ column: "", direction: "ascending" });

    const tokenAddresses = pairs.flatMap((pair) => [pair.token0.address, pair.token1.address]);
    const prices = useTokenPrices("binance-smart-chain", tokenAddresses);

    const [adjustedPairs, setAdjustedPairs] = useState<AdjustedPairData[]>([]);

    useEffect(() => {
        const fetchPairs = async () => {
            try {
                const response = await fetch("/api/moralis/liquidityPairs");
                const data: PairData[] = await response.json();
                setPairs(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching liquidity pairs:", error);
                setLoading(false);
            }
        };
        fetchPairs();
    }, []);

    useEffect(() => {
        if (!loading && pairs.length > 0 && Object.keys(prices).length > 0) {
            const adjusted = pairs.map((pair) => {
                const token0Price = prices[pair.token0.address];
                const token1Price = prices[pair.token1.address];

                const reserve0 = convertToDecimal(pair.reserve0);
                const reserve1 = convertToDecimal(pair.reserve1);

                let reserve0Value = token0Price ? reserve0 * token0Price : null;
                let reserve1Value = token1Price ? reserve1 * token1Price : null;

                let adjusted = false;

                // Adjust values if one of them is missing or zero
                if (!(reserve0Value > 0) && reserve1Value > 0) {
                    reserve0Value = reserve1Value;
                    adjusted = true;
                }
                if (!(reserve1Value > 0) && reserve0Value > 0) {
                    reserve1Value = reserve0Value;
                    adjusted = true;
                }
                if (!(reserve0Value > 0) && !(reserve1Value > 0)) {
                    reserve0Value = 0;
                    reserve1Value = 0;
                    adjusted = true;
                }

                const lpValue = reserve0Value + reserve1Value;

                const pairName = `${pair.token0.symbol === "ASX" ? pair.token1.symbol : pair.token0.symbol} / ASX`;

                return {
                    ...pair,
                    reserve0: reserve0, // Now a number
                    reserve1: reserve1, // Now a number
                    reserve0Value: reserve0Value,
                    reserve1Value: reserve1Value,
                    lpValue: lpValue,
                    pairName: pairName,
                    adjusted: adjusted,
                } as AdjustedPairData;
            });

            setAdjustedPairs(adjusted);
        }
    }, [loading, pairs, prices]);

    const totalLPValue = adjustedPairs.reduce((total, pair) => total + pair.lpValue, 0);

    const handleSort = (column: string) => {
        const direction = sortState.direction === "ascending" ? "descending" : "ascending";
        setSortState({ column, direction });

        const sortedPairs = [...adjustedPairs].sort((a, b) => {
            let aValue: number | string, bValue: number | string;

            switch (column) {
                case "LPValue":
                    aValue = a.lpValue;
                    bValue = b.lpValue;
                    break;
                case "Value0":
                    aValue = a.reserve0Value;
                    bValue = b.reserve0Value;
                    break;
                case "Value1":
                    aValue = a.reserve1Value;
                    bValue = b.reserve1Value;
                    break;
                case "pair":
                    aValue = a.pairName;
                    bValue = b.pairName;
                    break;
                default:
                    aValue = 0;
                    bValue = 0;
            }

            if (typeof aValue === "number" && typeof bValue === "number") {
                return direction === "ascending" ? aValue - bValue : bValue - aValue;
            } else if (typeof aValue === "string" && typeof bValue === "string") {
                return direction === "ascending" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
            return 0;
        });

        setAdjustedPairs(sortedPairs);
    };

    const renderArrow = (columnName: string) => {
        const arrowType = sortState.column === columnName ? (sortState.direction === "ascending" ? "↓" : "↑") : "↕";
        return arrowType;
    };

    if (loading || adjustedPairs.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <div className={styles.cryptoTableContainer}>
            <div className={styles.headerContainer}>
                <h2 className={styles.cryptoTableHeader}>
                    Liquidity Pairs - Total LP Value: $
                    {totalLPValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </h2>
            </div>
            <div className="scrollContainer">
                <table className={styles.cryptoTable}>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort("pair")}>Pair {renderArrow("pair")}</th>
                            <th>Reserve0</th>
                            <th onClick={() => handleSort("Value0")}>Value0 {renderArrow("Value0")}</th>
                            <th>Reserve1</th>
                            <th onClick={() => handleSort("Value1")}>Value1 {renderArrow("Value1")}</th>
                            <th onClick={() => handleSort("LPValue")}>LP Value {renderArrow("LPValue")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {adjustedPairs.map((pair, index) => (
                            <tr key={index}>
                                <td>
                                    <a
                                        className={styles.pairColumn}
                                        href={`https://bscscan.com/address/${pair.pairAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {pair.pairName}
                                    </a>
                                </td>
                                <td>{pair.reserve0.toFixed(2).toLocaleString()}</td>
                                <td>
                                    ${pair.reserve0Value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </td>
                                <td>{pair.reserve1.toFixed(2).toLocaleString()}</td>
                                <td>
                                    ${pair.reserve1Value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </td>
                                <td>
                                    ${pair.lpValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LiquidityPairs;
