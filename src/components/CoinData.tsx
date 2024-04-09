/*


______ _________________ _____ _____   ___ _____ ___________ 
|  _  \  ___| ___ \ ___ \_   _/  __ \ / _ \_   _|  ___|  _  \
| | | | |__ | |_/ / |_/ / | | | /  \// /_\ \| | | |__ | | | |
| | | |  __||  __/|    /  | | | |    |  _  || | |  __|| | | |
| |/ /| |___| |   | |\ \ _| |_| \__/\| | | || | | |___| |/ / 
|___/ \____/\_|   \_| \_|\___/ \____/\_| |_/\_/ \____/|___/  
                                                             
    - Replaced by CryptoTable.tsx                                                         
  
  */


import React, { useState, useEffect } from 'react';

const CoinData = () => {
  const [coinData, setCoinData] = useState([]);
  const [currency, setCurrency] = useState('usd');

  useEffect(() => {
    const fetchCoinData = async () => {
      const url = 'https://pro-api.coingecko.com/api/v3/coins/bsc/contract/0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B';
      const options = { method: 'GET', headers: { 'x-cg-pro-api-key': process.env.NEXT_PUBLIC_CG_API } };

      try {
        const response = await fetch(url, options);
        const data = await response.json();
        setCoinData(data.tickers);
      } catch (error) {
        console.error('Error fetching coin data:', error);
      }
    };

    fetchCoinData();
  }, []);

  const handleCurrencyChange = (event) => {
    setCurrency(event.target.value);
  };

  return (
    <div>
      <select onChange={handleCurrencyChange}>
        <option value="usd">USD</option>
        <option value="btc">BTC</option>
        <option value="eth">ETH</option>
        {/* Add more currencies as needed */}
      </select>
      <table>
        <thead>
          <tr>
            <th>Pair</th>
            <th>V2 or V3</th>
            <th>Price</th>
            <th>Liquidity Amount</th>
            <th>Volume</th>
            <th>24h Change</th>
            {/* Add other columns as needed */}
          </tr>
        </thead>
        <tbody>
          {coinData.map((item, index) => (
            <tr key={index}>
              <td>{item.base}/{item.target}</td>
              <td>{item.market.identifier.includes('v3') ? 'V3' : 'V2'}</td>
              <td>{item.converted_last[currency]}</td>
              <td>{/* Placeholder for liquidity amount */}</td>
              <td>{item.converted_volume[currency]}</td>
              <td>{/* Placeholder for 24h change, calculate if necessary */}</td>
              {/* Populate other columns as needed */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CoinData;
