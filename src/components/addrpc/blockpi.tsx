import React from 'react';

const AddBlockPiRPC = () => {

  const handleClick = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x38', // 56 in hexadecimal
            chainName: 'BSC BlockPi',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18
            },
            rpcUrls: ['https://bsc.blockpi.network/v1/rpc/public'],
            blockExplorerUrls: ['https://bscscan.com']
          }]
        });
        ;
      } catch (error) {
        console.error(error);
        ;
      }
    } else {
      ;
    }
  };

  return (
    <div>
      <img src="/logos//partners/blockpi.svg" alt="bloxroute_logo" onClick={handleClick} style={{ cursor: 'pointer', height: '40px' }} />
    </div>
  );
};

export default AddBlockPiRPC;
