// src/components/DebankLPTrack.tsx
import React from 'react';
import Image from 'next/image';
import useDebankData from '../hooks/useDebankData';
import styles from './DebankLPTrack.module.css';
import { Protocol, LPToken } from '../types/deBanktypes';

const DebankLPTrack: React.FC = () => {
    const data: Protocol[] | null = useDebankData();

    if (!data) {
        return <div>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            {data.map((protocol: Protocol) => (
                <div key={protocol.id} className={styles.protocol}>
                    <div className={styles.header}>
                        <div className={styles.protocolInfo}>
                            {protocol.logo_url ? (
                                <Image
                                    src={protocol.logo_url}
                                    alt={protocol.name}
                                    className={styles.logo}
                                    width={32}
                                    height={32}
                                />
                            ) : (
                                <div className={styles.noLogo}>No Image</div> // Placeholder if no logo URL is present
                            )}
                            <h2 className={styles.protocolName}>{protocol.name}</h2>
                        </div>
                        <span className={styles.totalValue}>
                            ${protocol.stats?.net_usd_value?.toLocaleString() || '0'}
                        </span>
                    </div>
                    <div className={styles.liquidityPoolLabel}>Liquidity Pool</div>
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
                                ?.filter((item) => item.name === 'Liquidity Pool')
                                .map((item, index) => (
                                    <React.Fragment key={index}>
                                        {item.detail?.supply_token_list?.map((lpToken: LPToken, tokenIndex) => (
                                            <tr key={`${index}-${tokenIndex}`}>
                                                <td className={styles.pool}>
                                                    {lpToken.logo_url ? (
                                                        <Image
                                                            src={lpToken.logo_url}
                                                            alt={lpToken.name}
                                                            width={20}
                                                            height={20}
                                                            className={styles.tokenLogo}
                                                        />
                                                    ) : (
                                                        <div className={styles.noTokenLogo}>No Logo</div>
                                                    )}
                                                    {lpToken.symbol}
                                                </td>
                                                <td>{lpToken.amount?.toFixed(4) || '0.0000'}</td>
                                                <td className={styles.usdValue}>
                                                    ${item.stats?.asset_usd_value?.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }) || '0.00'}
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default DebankLPTrack;
