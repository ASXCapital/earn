import React from "react";

const AddBloxRPC = () => {
  const handleClick = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x38", // 56 in hexadecimal
              chainName: "BSC Bloxroute",
              nativeCurrency: {
                name: "BNB",
                symbol: "BNB",
                decimals: 18,
              },
              rpcUrls: ["https://bsc.rpc.blxrbdn.com"],
              blockExplorerUrls: ["https://bscscan.com"],
            },
          ],
        });
      } catch (error) {
        console.error(error);
      }
    } else {
    }
  };

  return (
    <div>
      <img
        src="/logos/partners/blox.webp"
        alt="bloxroute_logo"
        onClick={handleClick}
        style={{ cursor: "pointer", height: "40px" }}
      />
    </div>
  );
};

export default AddBloxRPC;
