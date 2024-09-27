import React, { useEffect } from "react";

const CoinGeckoWidget = () => {
  useEffect(() => {
    // Create a script element
    const script = document.createElement("script");
    script.src =
      "https://widgets.coingecko.com/gecko-coin-price-marquee-widget.js";
    script.async = true;

    // Append the script to the document body
    document.body.appendChild(script);

    // Remove the script on component unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <gecko-coin-price-marquee-widget
      locale="en"
      dark-mode="true"
      outlined="true"
      coin-ids="asx-capital,bitcoin,solana,ethereum,tether-gold,ripple,dogecoin,the-open-network"
      initial-currency="usd"
    ></gecko-coin-price-marquee-widget>
  );
};

export default CoinGeckoWidget;
