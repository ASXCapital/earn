// file: src/components/dashboard/ChainBalances.tsx


import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import styles from './ChainBalances.module.css'; // Import your styles


const ChainBalances = () => {
    const [chainData, setChainData] = useState([]);
    const { address } = useAccount(); // Get the connected wallet's address
  
    useEffect(() => {
      const fetchData = async () => {
        if (address) { // Ensure there's an address before fetching
          try {
            const response = await fetch(`/api/moralis/walletNetWorth?address=${address}`);
            
            if (!response.ok) {
              throw new Error('Failed to fetch net worth data');
            }
  
            const data = await response.json();
            setChainData(data.chains);
          } catch (error) {
            console.error('Failed to fetch data:', error);
          }
        }
      };
  
      fetchData();
    }, [address]); // Re-fetch when the address changes
    return (
        <div>
          <h3>Wallet Net Worth by Chain</h3>
          {chainData.length > 0 ? (
            <table className={styles.chainBalancesTable}>
              <thead>
                <tr>
                  <th>Chain</th>
                  <th>Native Balance (ETH)</th>
                  <th>Native Balance (USD)</th>
                  <th>Token Balance (USD)</th>
                  <th>Net Worth (USD)</th>
                </tr>
              </thead>
              <tbody>
                {chainData.map((chain, index) => (
                  <tr key={index}>
                    <td>{chain.chain}</td>
                    <td>{parseFloat(chain.native_balance_formatted).toFixed(2)}</td>
                    <td>${parseFloat(chain.native_balance_usd).toFixed(2)}</td>
                    <td>${parseFloat(chain.token_balance_usd).toFixed(2)}</td>
                    <td>${parseFloat(chain.networth_usd).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      );
    };
    
    export default ChainBalances;