import React, { useState, useEffect } from "react";

const WalletStats = () => {
  const [chainsData, setChainsData] = useState([]);
  const [totalNetworth, setTotalNetworth] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      const apiURL = process.env.NEXT_PUBLIC_MORALIS_API_URL; // Replace with your actual API endpoint
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_MORALIS_API_KEY,
        },
      };

      try {
        const response = await fetch(apiURL, options);
        if (!response.ok) {
          throw new Error("Failed to fetch wallet data");
        }
        const data = await response.json();
        setChainsData(data.chains);
        setTotalNetworth(data.total_networth_usd);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chainsData.length) return <div>No wallet data available</div>;

  return (
    <div>
      <h2>Wallet Stats</h2>
      <p>Total Networth (USD): ${totalNetworth}</p>
      {chainsData.map((chain, index) => (
        <div key={index}>
          <h3>{chain.chain.toUpperCase()}</h3>
          <p>Native Balance (Formatted): {chain.native_balance_formatted}</p>
          <p>Native Balance (USD): ${chain.native_balance_usd}</p>
          <p>Token Balance (USD): ${chain.token_balance_usd}</p>
          <p>Networth (USD): ${chain.networth_usd}</p>
        </div>
      ))}
    </div>
  );
};

export default WalletStats;
