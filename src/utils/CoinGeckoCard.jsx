import React, { useEffect } from "react";

const CoinGeckoCard = () => {
  useEffect(() => {
    // Create a script element
    const script = document.createElement("script");
    script.src = "https://widgets.coingecko.com/gecko-coin-ticker-widget.js";
    script.async = true;

    // Append the script to the document body
    document.body.appendChild(script);

    // Remove the script on component unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <gecko-coin-ticker-widget
      locale="en"
      dark-mode="true"
      transparent-background="true"
      outlined="true"
      coin-id="asx-capital"
      initial-currency="usd"
      width="800"
      display="flex"
      justify-content="center"

      // align to centre:
    ></gecko-coin-ticker-widget>
  );
};

export default CoinGeckoCard;
