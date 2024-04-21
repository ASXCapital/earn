import React, { useState, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import styles from "./CryptoTable.module.css";  // Reusing the same CSS file
import { ClipboardIcon, QuestionMarkCircleIcon } from '@heroicons/react/solid'; // Ensure these are installed or use an equivalent

const TokenBalances = () => {
  const [tokenData, setTokenData] = useState([]);
  const { address } = useAccount();
  const [chain, setChain] = useState("eth");
  const [excludeSpam, setExcludeSpam] = useState(true);
  const [excludeUnverifiedContracts, setExcludeUnverifiedContracts] = useState(true);
  const [excludeNative, setExcludeNative] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false); // For toggling content visibility
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const tableRef = useRef(null); // Reference to the table

  const fetchTokens = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        chain,
        exclude_spam: excludeSpam.toString(),
        exclude_unverified_contracts: excludeUnverifiedContracts.toString(),
        exclude_native: excludeNative.toString(),
      }).toString();

      const response = await fetch(`/api/moralis/walletTokenBalances?address=${address}&${queryParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch token data: ${response.statusText}`);
      }
      const data = await response.json();
      setTokenData(data.result);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching token data:", error);
      setLoading(false);
    }
  };

  const toggleContentVisibility = () => {
    setIsContentVisible(!isContentVisible);
  };

  const handleCopyToClipboard = useCallback((tokenAddress) => {
    navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Message will disappear after 2 seconds
  }, []);

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort order if the same column is clicked again
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set the new sorting column
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Sorting logic for tokenData
  let sortedTokenData = [...tokenData];
  if (sortBy) {
    sortedTokenData.sort((a, b) => {
      const valueA = a[sortBy];
      const valueB = b[sortBy];
      if (typeof valueA === 'string') {
        return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      } else {
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      }
    });
  }

  // Function to render sorting arrow
  const renderSortingArrow = (column) => {
    if (sortBy === column) {
      return sortOrder === 'asc' ? '▲' : '▼';
    }
    return '↕';
  };



  return (
    <div className={styles.cryptoTableContainer}>
      <div className={styles.cryptoTableHeader2} onClick={toggleContentVisibility}>
        <div className={styles.headerContent}>
          <h2 className={styles.cryptoTableHeader}>Token Balances</h2>
          <div className={styles.subTitle}>Token holdings accross all EVM chains</div>

          <div className={styles.dropdownArrow}>{isContentVisible ? "▼" : "◀︎"}</div>
        </div>
      </div>
      {isContentVisible && (
        <div>
          <div className={styles.filterOptions}>
            <select className={styles.styledSelect} value={chain} onChange={(e) => setChain(e.target.value)}>
              <option value="eth">Ethereum</option>
              <option value="bsc">Binance Smart Chain</option>
              <option value="polygon">Polygon</option>
              <option value="avalanche">Avalanche</option>
              <option value="fantom">Fantom</option>
              <option value="cronos">Cronos</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
              <option value="base">Base</option>
            </select>
            <div className={styles.checkboxContainer}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={excludeSpam} onChange={(e) => setExcludeSpam(e.target.checked)} />
                Exclude Spam Tokens
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={excludeUnverifiedContracts} onChange={(e) => setExcludeUnverifiedContracts(e.target.checked)} />
                Exclude Unverified Contracts
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={!excludeNative} onChange={(e) => setExcludeNative(!e.target.checked)} />
                Include Native Tokens
              </label>
            </div>
            <button className={styles.styledButton} onClick={fetchTokens} disabled={loading}>
              {loading ? 'Loading...' : 'Fetch'}
            </button>

          </div>




          <div className={styles.portfolioBar}>
            {tokenData.map((token, index) => (
              <div
                key={index}
                title={token.symbol}  // Tooltip showing the token symbol
                style={{
                  width: `${token.portfolio_percentage}%`,
                  background: `hsla(${Math.random() * 360}, 50%, 50%, 0.9)`,
                  height: '20px',
                  borderRight: '1px solid #333',
                  transition: 'transform 0.3s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scaleY(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scaleY(1)'}
              />
            ))}
          </div>




          <table className={styles.cryptoTable}>
            <thead>
              <tr>
                <th onClick={() => handleSort('symbol')}>Token {renderSortingArrow('symbol')}</th>
                <th onClick={() => handleSort('token_address')}>Token Address {renderSortingArrow('token_address')}</th>
                <th onClick={() => handleSort('balance')}>Balance {renderSortingArrow('balance')}</th>
                <th onClick={() => handleSort('usd_price')}>Price {renderSortingArrow('usd_price')}</th>
                <th onClick={() => handleSort('usd_value')}>USD Val. {renderSortingArrow('usd_value')}</th>
                <th onClick={() => handleSort('usd_price_24hr_usd_change')}>24h (%) {renderSortingArrow('usd_price_24hr_usd_change')}</th>
                <th onClick={() => handleSort('portfolio_percentage')}>Portfolio % {renderSortingArrow('portfolio_percentage')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedTokenData.map((token, index) => (
                <tr key={index}>
                  <td>
                    {token.thumbnail ? (
                      <img src={token.thumbnail} alt={token.symbol} style={{ width: "24px", height: "24px", marginRight: "8px" }} />
                    ) : (
                      <QuestionMarkCircleIcon className="missingImageIcon" style={{ width: "24px", height: "24px", marginRight: "8px" }} />
                    )}
                    {token.symbol}
                  </td>
                  <td onClick={() => handleCopyToClipboard(token.token_address)}>
                    {`0x${token.token_address.slice(2, 6)}...${token.token_address.slice(-4)}`}
                    <ClipboardIcon className="copyIcon" style={{ marginLeft: '5px', cursor: 'pointer', height: '16px' }} />
                  </td>
                  <td>{(parseFloat(token.balance) / (10 ** token.decimals)).toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <div style={{ marginRight: '8px' }}>${token.usd_price.toFixed(2)}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <sup style={{ marginLeft: '4px', color: '#4CAF50' }}>{`$${(token.usd_price + token.usd_price_24hr_usd_change).toFixed(2)}`}</sup>
                        <sub style={{ marginLeft: '4px', color: '#F44336' }}>{`$${(token.usd_price - token.usd_price_24hr_usd_change).toFixed(2)}`}</sub>
                      </div>
                    </div>
                  </td>
                  <td>${parseFloat(token.usd_value).toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      {token.usd_price_24hr_usd_change > 0 ? (
                        <span style={{ color: '#4CAF50', marginRight: '4px' }}>▲</span>
                      ) : (
                        <span style={{ color: '#F44336', marginRight: '4px' }}>▼</span>
                      )}

                      <span style={{ color: token.usd_price_24hr_usd_change > 0 ? '#4CAF50' : '#F44336' }}>
                        {`${((token.usd_price_24hr_usd_change / token.usd_price) * 100).toFixed(2)}%`}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'right' }}>
                      {token.portfolio_percentage.toFixed(2)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TokenBalances;
