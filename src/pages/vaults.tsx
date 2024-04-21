import React, { useState } from "react";
import { Container, Row, Col, Button, FormCheck, Image } from "react-bootstrap";
import VaultCard from "../components/vaults/VaultCard";
import { vaultsConfig } from "../config/vaultsConfig";
import { useAccount } from "wagmi";

import styles from "../styles/VaultsPage.module.css";

import RpcPingTest from "../components/vaults/RpcUrlForm";

import TotalTVLDisplay from "../components/TotalTVLDisplay";


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
        <h2 className={styles.headerTitle}>Vaults</h2>
        <br />
        <div className={styles.totalTVL}>
          <TotalTVLDisplay />
        </div>
        <br />
        <div className={styles.stakingIntro}>
          <p>
            ASX Vaults are auto-compounding staking pools. By depositing a
            single token, our vaults will create the underlying position, and
            compound the yield daily. Users can withdraw at any time.
          </p>

          {/* How does it work section with diagram */}


          <p className={styles.howItWorksDescription}>
            Simply deposit BNB, WBNB, ETH or BTCB and gain exposure to the ASX
            ecosystem.
            <br />
            <br />
            Recieve vASX tokens in return which can then be deposited or burned
            to then recieve back the initial token.
          </p>
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

          <div className={styles.stakingWrapper2}>
            <p>
              By consolidating transactions and reducing unnecessary contract
              interactions, ASX achieves approximately 70% savings on
              gas costs in comparison to similar products. However, due to the nature of the transactions, which
              include swaps and liquidity pair creations, there is a potential
              exposure to malicious MEV (Miner Extractable Value).
            </p>
            <div className={styles.stakingWrapper3}>
              <p>
                To mitigate this risk and enhance security, users are required
                to connect via one of the specified RPC URLs below. Please use
                the MetaMask logo to add the appropriate network to your wallet.

              </p>
            </div>
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
            <Button
              onClick={() => setShowVaults(!showVaults)}
              variant="secondary"
              className={styles.toggleButton}
            >
              {showVaults ? "Hide Vaults" : "Show Vaults"}
            </Button>
          </div>
        </div>

      </Container>
    </div>
  );
};

export default VaultsPage;
