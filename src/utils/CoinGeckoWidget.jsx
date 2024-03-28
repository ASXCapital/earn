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
      coin-ids="bitcoin,ethereum,binancecoin,asx-capital,ripple,solana"
      currency="usd"
      background-color="transparent"
      locale="en"
      font-color="rgb(42, 228, 210)">
      
      
    </coingecko-coin-price-marquee-widget>
  );
};

export default CoinGeckoWidget;
