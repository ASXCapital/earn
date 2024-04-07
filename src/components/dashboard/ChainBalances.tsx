import React, { useEffect, useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import styles from './ChainBalances.module.css';

const chainLogos = {  base: 'base-logo-in-blue.svg',
bsc: 'bnb-bnb-logo.svg',
cronos: 'cronos-cro-logo.svg',
eth: 'ethereum-eth-logo.svg',
fantom: 'fantom-ftm-logo.svg',
polygon: 'polygon-matic-logo.svg',
avalanche: 'avalanche-avax-logo.svg',
arbitrum: 'arbitrum-arb-logo.svg',
gnosis: 'gnosis-gno-gno-logo.svg', // Assuming you have a logo for Gnosis, adjust the filename as necessary
optimism: 'optimism-ethereum-op-logo.svg',
};

const ChainBalances = () => {
  const [chainData, setChainData] = useState([]);
  const { address } = useAccount();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    const fetchData = async () => {
      if (address) {
        try {
          const response = await fetch(`/api/moralis/walletNetWorth?address=${address}`);
          if (!response.ok) throw new Error('Failed to fetch net worth data');
          const data = await response.json();
          setChainData(data.chains);
        } catch (error) {
          console.error('Failed to fetch data:', error);
        }
      }
    };
    fetchData();
  }, [address]);

  const totalNetWorth = useMemo(() => chainData.reduce((acc, chain) => acc + parseFloat(chain.networth_usd), 0), [chainData]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const formatNumber = (number) => new Intl.NumberFormat('en-US').format(number);

  const formatUSD = (amount) => {
    const [integerPart, decimalPart] = formatNumber(amount).split('.');
    return decimalPart ? `${integerPart}.<span class="decimals">${decimalPart}</span>` : integerPart;
  };

  const getSortDirectionArrow = (key) => {
    if (sortConfig.key !== key) return '⇵';
    return sortConfig.direction === 'descending' ? '▲' : '▼';
  };

  const { sortedData, omittedChains } = useMemo(() => {
    const filteredData = chainData.filter(chain => parseFloat(chain.networth_usd) !== 0);
    const omitted = chainData.filter(chain => parseFloat(chain.networth_usd) === 0).map(chain => chain.chain);

    const sorted = filteredData.sort((a, b) => {
      const aValue = isNaN(parseFloat(a[sortConfig.key])) ? a[sortConfig.key] : parseFloat(a[sortConfig.key]);
      const bValue = isNaN(parseFloat(b[sortConfig.key])) ? b[sortConfig.key] : parseFloat(b[sortConfig.key]);
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      return 0;
    });

    return { sortedData: sorted, omittedChains: omitted };
  }, [chainData, sortConfig]);

  return (
    <div className={styles.chainBalancesTableContainer}>
      <div className={styles.tableHeader}>
        <h2 className={styles.chainBalancesTableHeader}>Wallet Net Worth by Chain</h2>
        <div className={styles.totalNetWorth}>TOTAL Net Worth (USD): {formatNumber(totalNetWorth)}</div>
      </div>
      {chainData.length > 0 ? (
        <>
          <table className={styles.chainBalancesTable}>
            <thead>
              <tr>
                <th>Chain</th>
                <th>Balance (ETH)</th>
                <th>ETH in USD</th>
                <th>Token Balance (USD)</th>
                <th>Net Worth (USD)</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((chain, index) => (
                <tr key={index}>
                  <td>
                    {chainLogos[chain.chain] && (
                      <img src={`/logos/${chainLogos[chain.chain]}`} alt="" style={{ width: '20px', marginRight: '8px', verticalAlign: 'middle' }} />
                    )}
                    {chain.chain}
                  </td>
                  <td>{parseFloat(chain.native_balance_formatted).toFixed(2)}</td>
                  <td>${parseFloat(chain.native_balance_usd).toFixed(2)}</td>
                  <td>${parseFloat(chain.token_balance_usd).toFixed(2)}</td>
                  <td>${parseFloat(chain.networth_usd).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {omittedChains.length > 0 && (
            <div className={styles.omittedChains}>
              Omitted {omittedChains.join(', ')} due to 0 balance
            </div>
          )}
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default ChainBalances;
