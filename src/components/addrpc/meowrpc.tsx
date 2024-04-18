import React from "react";

const AddMeowRPC = () => {
  const handleClick = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x38", // 56 in hexadecimal
              chainName: "😸 BNB MEOW PROTECT",
              nativeCurrency: {
                name: "BNB",
                symbol: "BNB",
                decimals: 18,
              },
              rpcUrls: ["https://bsc.meowrpc.com"],
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
        src="/logos/meow.png"
        alt="MEOW logo"
        onClick={handleClick}
        style={{ cursor: "pointer", height: "40px" }}
      />
    </div>
  );
};

export default AddMeowRPC;
