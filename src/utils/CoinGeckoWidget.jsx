import React, { useEffect } from 'react';

const CoinGeckoWidget = () => {
  useEffect(() => {
    // Create a script element
    const script = document.createElement('script');
    script.src = "https://widgets.coingecko.com/coingecko-coin-price-marquee-widget.js";
    script.async = true;

    // Append the script to the document body
    document.body.appendChild(script);

    // Remove the script on component unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <coingecko-coin-price-marquee-widget
      coin-ids="bitcoin,ethereum,binancecoin,asx-capital"
      currency="usd"
      background-color="#030303"
      locale="en"
      font-color="#00f999">
    </coingecko-coin-price-marquee-widget>
  );
};

export default CoinGeckoWidget;
