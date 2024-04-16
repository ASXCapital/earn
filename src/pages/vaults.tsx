import React, { useState } from 'react';
import { Container, Row, Col, Button, FormCheck } from 'react-bootstrap';
import VaultCard from '../components/vaults/VaultCard';
import { vaultsConfig } from '../config/vaultsConfig';
import { useAccount } from 'wagmi';

import styles from '../styles/VaultsPage.module.css';

import RpcPingTest from '../components/vaults/RpcUrlForm';

const VaultsPage = () => {
  const { address: userAddress } = useAccount();
  const [showVaults, setShowVaults] = useState(false); // State to toggle vaults visibility
  const [agreed, setAgreed] = useState(false); // State for agreement checkbox

  const handleCheckbox = (event) => {
    setAgreed(event.target.checked);
  };

  return (
    <div className={styles.stakingWrapper}>
      <Container fluid="lg">
        <h1 className={styles.headerTitle}>Vaults</h1>
        <div className={styles.stakingIntro}>
          <p>Ben can you come up with something snazzy here?</p>
          <div className={styles.stakingWrapper2}>
            <p>By consolidating transactions and reducing unnecessary contract interactions, our solution achieves approximately 70% savings on gas costs. However, due to the nature of the transactions, which include swaps and liquidity pair creations, there is a potential exposure to malicious MEV (Miner Extractable Value).</p>
            <p>To mitigate this risk and enhance security, users are required to connect via one of the specified RPC URLs below. Please use the MetaMask logo to add the appropriate network to your wallet. Once this setup is complete, you may proceed.</p>
            <Row>
              <RpcPingTest />
            </Row>
            <FormCheck
              type="checkbox"
              label="I agree to the terms stated above."
              checked={agreed}
              onChange={handleCheckbox}
              className={styles.agreementCheck}
            />
            <Button onClick={() => setShowVaults(!showVaults)} variant="secondary" className={styles.toggleButton}>
              {showVaults ? 'Hide Vaults' : 'Show Vaults'}
            </Button>
          </div>
        </div>
        {showVaults && agreed && (
          <Row className={styles.transparentTable}>
            {vaultsConfig.map((vault) => (
              <Col key={vault.id} md={6} xs={12} className={styles.vaultCol}>
                <VaultCard
                  title={vault.title}
                  isNativeToken={vault.isNativeToken}
                  receiveToken={vault.vaultToken.symbol}
                  stakedTokenName={vault.vaultToken.depositToken.symbol}
                  vaultTokenName={vault.vaultToken.symbol}
                  stakedTokenContract={vault.vaultToken.depositToken.address}
                  vaultTokenContract={vault.vaultToken.address}
                  tvl={"loading..."}
                  apy={0}
                  userAddress={userAddress}
                  poolId={vault.id}
                />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default VaultsPage;
