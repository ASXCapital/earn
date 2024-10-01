// src/components/DebankLPTrack.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import styles from './DebankLPTrack.module.css';
import { Protocol, PortfolioItem } from '../types/deBanktypes';

const DebankLPTrack: React.FC = () => {
    const [data, setData] = useState<{ mainWallet: Protocol[]; stakedLPs: Protocol[] } | null>(null);
    const [mainExpanded, setMainExpanded] = useState(false);
    const [stakedExpanded, setStakedExpanded] = useState(false);
    const [dexExpanded, setDexExpanded] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        // Function to fetch data from the backend
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/debank');
                setData(response.data);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };

        // Initial fetch
        fetchData();

        // Set interval to fetch data every 5 seconds
        const interval = setInterval(fetchData, 1000);

        // Clear interval on component unmount
        return () => clearInterval(interval);
    }, []);

    const toggleDexExpanded = (id: string) => {
        setDexExpanded(prevState => ({
            ...prevState,
            [id]: !prevState[id]
        }));
    };

    if (!data) {
        return <div className={styles.loading}>Loading...</div>;
    }

    const { mainWallet, stakedLPs } = data;

    // Common function to calculate total liquidity
    const calculateTotalLiquidity = (protocols: Protocol[]) =>
        protocols.reduce((acc, protocol) => {
            const protocolLiquidity = protocol.portfolio_item_list
                .filter((item) => item.name === 'Liquidity Pool' || item.isStakedLP)
                .reduce((sum, item) => sum + (item.stats?.asset_usd_value || 0), 0);
            return acc + protocolLiquidity;
        }, 0);

    const mainWalletLiquidity = calculateTotalLiquidity(mainWallet);
    const stakedLPLiquidity = calculateTotalLiquidity(stakedLPs);
    const totalLiquidity = mainWalletLiquidity + stakedLPLiquidity;

    // Aggregate and combine all staked LP pairs into a single list
    const aggregatedStakedPairs = stakedLPs
        .flatMap(protocol => protocol.portfolio_item_list)
        .filter((item) => item.name === 'Liquidity Pool' || item.isStakedLP)
        .reduce((acc: PortfolioItem[], current) => {
            const pairSymbols = current.detail?.supply_token_list.map(token => token.symbol).join(' + ');
            if (!acc.some(item => item.detail?.supply_token_list.map(token => token.symbol).join(' + ') === pairSymbols)) {
                acc.push(current);
            }
            return acc;
        }, []);

    return (
        <div className={styles.container}>
            {/* Total Liquidity */}
            <div className={styles.statsContainer} onClick={() => setMainExpanded(!mainExpanded)}>
                <span>Total Liquidity:</span>
                <div className={styles.totalTVL}>
                    ${totalLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </div>

            {/* Main Wallet LPs */}
            <div className={styles.statsContainer} onClick={() => setMainExpanded(!mainExpanded)}>
                <div className={styles.statsHeader}>
                    <span className={`${styles.arrow} ${mainExpanded ? styles.expanded : ''}`} />
                    <div className={styles.statsInfo}>
                        <div className={styles.statItem}>
                            <span>ASX Deployed Liquidity:</span>
                            <div className={styles.totalValue}>
                                ${mainWalletLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Display Main Wallet LPs */}
            {mainExpanded && mainWallet.map((protocol: Protocol) => {
                const totalValue = protocol.portfolio_item_list
                    .filter((item) => item.name === 'Liquidity Pool' || item.isStakedLP)
                    .reduce((acc, item) => acc + (item.stats?.asset_usd_value || 0), 0);

                if (totalValue === 0) {
                    return null;
                }

                const isExpanded = dexExpanded[protocol.id] ?? true;

                return (
                    <div key={protocol.id} className={styles.protocolCard}>
                        <div className={styles.header} onClick={() => toggleDexExpanded(protocol.id)}>
                            <div className={styles.protocolInfo}>
                                <span className={`${styles.arrow} ${isExpanded ? styles.expanded : ''}`} />
                                <Image
                                    src={protocol.logo_url || '/logos/Thinking_Face_Emoji.png'}
                                    alt={protocol.name}
                                    className={styles.logo}
                                    width={32}
                                    height={32}
                                />
                                <h2 className={styles.protocolName}>{protocol.name}</h2>
                            </div>
                            <span className={styles.totalValueLarge}>
                                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        {isExpanded && (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Pool</th>
                                        <th>Balance</th>
                                        <th className={styles.usdValue}>USD Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {protocol.portfolio_item_list
                                        .filter((item) => item.name === 'Liquidity Pool' || item.isStakedLP)
                                        .map((item, index) => {
                                            const tokenPairs = item.detail?.supply_token_list;
                                            if (tokenPairs && tokenPairs.length >= 2) {
                                                const pairSymbols = tokenPairs.map((token) => token.symbol).join(' + ');

                                                return (
                                                    <tr key={index}>
                                                        <td className={styles.pool}>
                                                            {tokenPairs.map((token, tokenIndex) => (
                                                                <Image
                                                                    key={tokenIndex}
                                                                    src={token.logo_url || '/logos/Thinking_Face_Emoji.png'}
                                                                    alt={token.name}
                                                                    width={20}
                                                                    height={20}
                                                                    className={styles.tokenLogo}
                                                                />
                                                            ))}
                                                            <span className={styles.pairSymbols}>{pairSymbols}</span>
                                                        </td>
                                                        <td className={styles.balance}>
                                                            {tokenPairs.map((token, tokenIndex) => (
                                                                <div key={tokenIndex} className={styles.balanceItem}>
                                                                    {token.amount.toFixed(4)} {token.symbol}
                                                                </div>
                                                            ))}
                                                        </td>
                                                        <td className={styles.usdValue}>
                                                            ${item.stats?.asset_usd_value.toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            return null;
                                        })}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            })}

            {/* Staked LPs */}
            <div className={styles.statsContainer} onClick={() => setStakedExpanded(!stakedExpanded)}>
                <div className={styles.statsHeader}>
                    <span className={`${styles.arrow} ${stakedExpanded ? styles.expanded : ''}`} />
                    <div className={styles.statsInfo}>
                        <div className={styles.statItem}>
                            <span>Staked LPs:</span>
                            <div className={styles.totalValueLarge}>
                                ${stakedLPLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Display Aggregated Staked LPs (Only Pairs) */}
            {stakedExpanded && (
                <div className={styles.protocolCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Pool</th>
                                <th>Balance</th>
                                <th className={styles.usdValue}>USD Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aggregatedStakedPairs.map((item, index) => {
                                const tokenPairs = item.detail?.supply_token_list;
                                if (tokenPairs && tokenPairs.length >= 2) {
                                    const pairSymbols = tokenPairs.map((token) => token.symbol).join(' + ');

                                    return (
                                        <tr key={index}>
                                            <td className={styles.pool}>
                                                {tokenPairs.map((token, tokenIndex) => (
                                                    <Image
                                                        key={tokenIndex}
                                                        src={token.logo_url || '/logos/Thinking_Face_Emoji.png'}
                                                        alt={token.name}
                                                        width={20}
                                                        height={20}
                                                        className={styles.tokenLogo}
                                                    />
                                                ))}
                                                <span className={styles.pairSymbols}>{pairSymbols}</span>
                                            </td>
                                            <td className={styles.balance}>
                                                {tokenPairs.map((token, tokenIndex) => (
                                                    <div key={tokenIndex} className={styles.balanceItem}>
                                                        {token.amount.toFixed(4)} {token.symbol}
                                                    </div>
                                                ))}
                                            </td>
                                            <td className={styles.usdValue}>
                                                ${item.stats?.asset_usd_value.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                        </tr>
                                    );
                                }
                                return null;
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DebankLPTrack;
