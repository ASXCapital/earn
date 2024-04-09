// pages/VaultsPage.tsx
import React from 'react';
import VaultCard from '../components/vaults/VaultCard';
import { vaultsConfig } from '../config/vaultsConfig'; // Ensure this path matches your file structure
import { useAccount } from 'wagmi'; // Import useAccount from wagmi

const VaultsPage: React.FC = () => {
  const { address: userAddress } = useAccount(); // Get the connected user's address

  return (
    <div className="vaultsPageContainer">
      <h1>Vaults</h1>
      <div className="vaultCardsWrapper">
        {vaultsConfig.map((vault) => (
          <VaultCard
            key={vault.id}
            title={vault.title}
            isNativeToken={vault.isNativeToken}
            receiveToken={vault.vaultToken.symbol}
            stakedTokenName={vault.vaultToken.depositToken.symbol} // Name of the staked token
            vaultTokenName={vault.vaultToken.symbol} // Name of the vault (liquid) token
            stakedTokenContract={vault.vaultToken.depositToken.address} // Contract address of the staked token
            vaultTokenContract={vault.vaultToken.address} // Contract address of the vault (liquid) token
            tvl={"$1,000,000"} // Placeholder for TVL, replace with actual data
            apy={10} // Placeholder for APY, replace with actual data
            userAddress={userAddress} // Connected user's address
          />
        ))}
      </div>
    </div>
  );
};

export default VaultsPage;






