import React from 'react';
import { Container, Row, Col } from 'react-bootstrap'; // Import Container, Row, and Col from react-bootstrap
import VaultCard from '../components/vaults/VaultCard';
import { vaultsConfig } from '../config/vaultsConfig'; // Ensure this path matches your file structure
import { useAccount } from 'wagmi'; // Import useAccount from wagmi

const VaultsPage: React.FC = () => {
  const { address: userAddress } = useAccount(); // Get the connected user's address

  return (
    <Container className="vaultsPageContainer" fluid="lg"> {/* 'fluid="lg"' will ensure the Container is fluid until the 'lg' breakpoint */}
      <h1 className="mb-4">Vaults</h1> {/* 'mb-4' adds a margin bottom for spacing */}
      <Row>
        {vaultsConfig.map((vault) => (
          <Col key={vault.id} md={6} xs={12} className="mb-4"> {/* 'md={6}' for 2 columns on medium devices and larger, 'xs={12}' for full width on smaller screens */}
            <VaultCard
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
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default VaultsPage;
