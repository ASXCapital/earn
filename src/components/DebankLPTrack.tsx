// components/DebankLPTrack.tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Image from 'next/image';
import styles from './DebankLPTrack.module.css';
import { Protocol, PortfolioItem } from '../types/deBanktypes';

// Easing function for "ease-in-out" effect
const easeInOutQuad = (t: number) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

const DebankLPTrack: React.FC = () => {
    const [data, setData] = useState<{ mainWallet: Protocol[]; stakedLPs: Protocol[] } | null>(null);
    const [mainExpanded, setMainExpanded] = useState(false);
    const [stakedExpanded, setStakedExpanded] = useState(false);
    const [dexExpanded, setDexExpanded] = useState<{ [key: string]: boolean }>({});
    const [displayedLiquidity, setDisplayedLiquidity] = useState(0);
    const currentLiquidity = useRef(0); // Ref to keep track of the current liquidity
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Function to calculate total liquidity
    const calculateTotalLiquidity = (protocols: Protocol[]) =>
        protocols.reduce((acc, protocol) => {
            const protocolLiquidity = protocol.portfolio_item_list
                .filter((item) => item.name === 'Liquidity Pool' || item.isStakedLP)
                .reduce((sum, item) => sum + (item.stats?.asset_usd_value || 0), 0);
            return acc + protocolLiquidity;
        }, 0);

    useEffect(() => {
        // Function to fetch data from the backend
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/debank');
                setData(response.data);

                // Calculate initial total liquidity
                const { mainWallet, stakedLPs } = response.data;
                const mainWalletLiquidity = calculateTotalLiquidity(mainWallet);
                const stakedLPLiquidity = calculateTotalLiquidity(stakedLPs);
                const totalLiquidity = mainWalletLiquidity + stakedLPLiquidity;

                // Initialize the displayed liquidity
                setDisplayedLiquidity(totalLiquidity);
                currentLiquidity.current = totalLiquidity;
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };

        // Function to oscillate the liquidity
        const oscillateLiquidity = () => {
            const randomChange = (Math.random() - 0.5) * 500; // Random value between -250 and 250
            const newLiquidity = currentLiquidity.current + randomChange;

            // Animate the change in liquidity
            animateLiquidityChange(currentLiquidity.current, newLiquidity, 2000); // Animate over 2 seconds
            currentLiquidity.current = newLiquidity;
        };

        // Function to animate the change in liquidity
        const animateLiquidityChange = (start: number, end: number, duration: number) => {
            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1); // Clamp progress to [0, 1]
                const easedProgress = easeInOutQuad(progress);
                const currentValue = start + (end - start) * easedProgress;

                setDisplayedLiquidity(currentValue);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        };

        // Initial fetch
        fetchData();

        // Set interval to oscillate the liquidity every 99 seconds
        const interval = setInterval(oscillateLiquidity, 99000);

        // Clear interval on component unmount
        return () => clearInterval(interval);
    }, []);

    const toggleDexExpanded = (id: string) => {
        setDexExpanded(prevState => ({
            ...prevState,
            [id]: !prevState[id]
        }));
    };

    const toggleSortOrder = () => {
        setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
    };

    if (!data) {
        return <div className={styles.loading}>Loading...</div>;
    }

    const { mainWallet, stakedLPs } = data;

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

    // Sort aggregated staked pairs
    const sortedAggregatedStakedPairs = [...aggregatedStakedPairs].sort((a, b) => {
        const valueA = a.stats?.asset_usd_value || 0;
        const valueB = b.stats?.asset_usd_value || 0;
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });

    return (
        <div className={styles.container}>
            {/* Total Liquidity */}
            <div className={styles.statsContainer}>
                <span className={styles.sectionTitle}>Total Liquidity:</span>
                <div className={styles.totalTVL}>
                    ${displayedLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </div>

            {/* Main Wallet LPs */}
            <div className={styles.statsContainer} onClick={() => setMainExpanded(!mainExpanded)}>
                <div className={styles.statsHeader}>
                    <span className={`${styles.arrow} ${mainExpanded ? styles.expanded : ''}`} />
                    <div className={styles.statsInfo}>
                        <div className={styles.statItem}>
                            <span className={styles.sectionTitle}>ASX Deployed Liquidity:</span>
                            <div className={styles.totalValue}>
                                ${calculateTotalLiquidity(mainWallet).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

                const isExpanded = dexExpanded[protocol.id] ?? false;

                // Sort the items
                const sortedItems = protocol.portfolio_item_list
                    .filter((item) => item.name === 'Liquidity Pool' || item.isStakedLP)
                    .sort((a, b) => {
                        const valueA = a.stats?.asset_usd_value || 0;
                        const valueB = b.stats?.asset_usd_value || 0;
                        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
                    });

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
                            <span className={styles.totalValue}>
                                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        {isExpanded && (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Pool</th>
                                        <th>Balance</th>
                                        <th className={styles.usdValue} onClick={toggleSortOrder}>
                                            USD Value
                                            <span className={styles.sortArrow}>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedItems.map((item, index) => {
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
                            <span className={styles.sectionTitle}>Staked LPs:</span>
                            <div className={styles.totalValue}>
                                ${calculateTotalLiquidity(stakedLPs).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                <th className={styles.usdValue} onClick={toggleSortOrder}>
                                    USD Value
                                    <span className={styles.sortArrow}>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAggregatedStakedPairs.map((item, index) => {
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
