import React, { useState, useEffect } from 'react';
import styles from './VaultCard.module.css';
import { useAccount, useBalance } from 'wagmi';
import { useTokenBalance } from '../../hooks/useTokenBalance';
import useTokenPrices from '../../hooks/useTokenPrices';
import { VaultCardProps } from '../../types/vaultTypes';
import { formatUnits, id } from 'ethers/lib/utils';
import { contracts } from '../../config/contracts';
import VaultStakeButton from './VaultStakeButton';
import VaultApproveButton from './VaultApproveButton';
import VaultWithdrawButton from './VaultWithdrawButton';
import VaultStakeButtonBNB from './VaultStakeButtonBNB';
import VaultWithdrawButtonBNB from './VaultWithdrawButtonBNB';
import { Card, Button, Row, Col, Form, Table, InputGroup, OverlayTrigger, Tooltip, Collapse } from 'react-bootstrap';
import { ethers, BigNumber } from 'ethers';

import TVLAndAPRDisplay from '../TVLAndAPRDisplay';

const VaultCard: React.FC<VaultCardProps> = ({
  title,
  receiveToken,
  tvl,
  apy,
  stakedTokenName,
  vaultTokenName,
  stakedTokenContract,
  vaultTokenContract,
  isNativeToken,
  poolId
}) => {
  const { address: userAddress } = useAccount();
  const [stakeAmount, setStakeAmount] = useState('');
  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({ address: userAddress });
  const { data: erc20TokenBalance, refetch: refetchErc20TokenBalance } = useTokenBalance(stakedTokenContract, userAddress);

  const [maxClickState, setMaxClickState] = useState(0); 
  const [refetchTrigger, setRefetchTrigger] = useState(0);  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStakeAmount(e.target.value);
  };

  const setMaxAmount = () => {
    switch (maxClickState) {
      case 0: 
        if (isNativeToken) {
          const ninetyFivePercent = ethers.BigNumber.from(nativeBalance).mul(95).div(100); 
          setStakeAmount(ethers.utils.formatEther(ninetyFivePercent)); 
        } else {
          setStakeAmount(ethers.utils.formatEther(erc20TokenBalance)); 
        }
        break;
      case 1: 
        setStakeAmount(ethers.utils.formatEther(vaultTokenBalance));
        break;
      case 2: 
        setStakeAmount('');
        break;
      default:
        break;
    }
    setMaxClickState((prevState) => (prevState + 1) % 3); 
  };

  const MaxButton = () => (
    <OverlayTrigger overlay={<Tooltip>Disabled to avoid accidental deposit of all gas token</Tooltip>} placement="top">
      <span className="d-inline-block">
        <Button disabled style={{
          pointerEvents: 'none', 
          opacity: 0.65, 
          color: 'black', 
          backgroundColor: 'grey', 
          borderColor: '#ddd',
          borderRadius: 0
        }}>
          Max
        </Button>
      </span>
    </OverlayTrigger>
  );

  const stakingTokenAddressForPrice = isNativeToken ? contracts.bscTokens.WBNB.toLowerCase() : stakedTokenContract.toLowerCase();
  const platformId = 'binance-smart-chain';
  const prices = useTokenPrices(platformId, [stakingTokenAddressForPrice]);
  const priceDisplay = prices[stakingTokenAddressForPrice]?.toFixed(2) || 'Loading...';
  const userBalance = isNativeToken ? nativeBalance : erc20TokenBalance;
  const { data: vaultTokenBalance } = useTokenBalance(vaultTokenContract, userAddress);

  const renderBalance = (balance: bigint | { decimals: number; formatted: string; symbol: string; value: bigint; } | undefined) => {
    if (balance === undefined || balance === null) {
      return `0`; // Display '0' when balance is undefined or null
    } else if (typeof balance === 'bigint') {
      const formattedBalance = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(parseFloat(formatUnits(balance.toString(), 18)));
      return `${formattedBalance}`;
    } else {
      const formattedBalance = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(parseFloat(formatUnits(balance.value.toString(), balance.decimals)));
      return `${formattedBalance}`;
    }
  };

  useEffect(() => {
    refetchNativeBalance();
    refetchErc20TokenBalance();
  }, [refetchTrigger, refetchNativeBalance, refetchErc20TokenBalance]);

  const handleUpdateAfterStake = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const [open, setOpen] = useState(false);

  return (
    <Card className={styles.vaultCard}>
      <Card.Header className={styles.vaultHeader}>{stakedTokenName}</Card.Header>
      <Card.Body className={styles.vaultBody}>
        <Card.Text>Receive: {receiveToken}</Card.Text>
        <TVLAndAPRDisplay poolId={poolId} />
        <Form.Group as={Col} className={styles.inputGroup}>
        <InputGroup>
  <Form.Control
    type="text"
    className={styles.formControl}
    value={stakeAmount}
    onChange={handleInputChange}
    placeholder="Amount to stake"
  />
  {isNativeToken ? (
    <OverlayTrigger
      overlay={<Tooltip id="disabled-tooltip">Disabled to avoid accidental deposit of all gas token</Tooltip>}
      placement="top"
    >
      <span className="d-inline-block" style={{ cursor: 'not-allowed' }}>
        <Button className={styles.disabledMaxButton} disabled style={{ pointerEvents: 'none' }}>
          Max
        </Button>
      </span>
    </OverlayTrigger>
  ) : (
    <Button className={styles.maxButton} onClick={setMaxAmount}>Max</Button>
  )}
</InputGroup>

</Form.Group>


        <Row className={styles.vaultButtons}>
  {!isNativeToken && (
    <>
      <Col xs={12} md={4} className={styles.vaultColumn}>
        <VaultStakeButton
          amount={stakeAmount}
          vaultContractAddress={vaultTokenContract}
          onUpdate={handleUpdateAfterStake}
          tokenAddress={stakedTokenContract}
        />
      </Col>
      <Col xs={12} md={4} className={styles.vaultColumn}>
        <VaultWithdrawButton
          vaulttokenAddress={vaultTokenContract}
          stakedTokenContract={stakedTokenContract}
          amount={stakeAmount}
          onUpdate={handleUpdateAfterStake}
        />
      </Col>
      <Col xs={12} md={4} className={styles.vaultColumn}>
        <VaultApproveButton
          userAddress={userAddress}
          tokenAddress={stakedTokenContract}
          stakingContractAddress={vaultTokenContract}
          onUpdate={handleUpdateAfterStake}
          inputValue={stakeAmount}
        />
      </Col>
    </>
  )}
  {isNativeToken && (
    <>
      <Col xs={12} md={6} className={styles.vaultColumn}>
        <VaultStakeButtonBNB
          amount={stakeAmount}
          vaultContractAddress={vaultTokenContract}
          onUpdate={handleUpdateAfterStake}
        />
      </Col>
      <Col xs={12} md={6} className={styles.vaultColumn}>
        <VaultWithdrawButtonBNB
          vaultTokenAddress={vaultTokenContract}
          amount={stakeAmount}
          wrap={false}
          onUpdate={handleUpdateAfterStake}
        />
      </Col>
    </>
  )}
  </Row>
  <Button
    onClick={() => setOpen(!open)}
    aria-controls="collapse-text"
    aria-expanded={open}
    variant="outline-info"
    className={styles.showDetailsButton}
  >
    {open ? 'Hide Details' : 'Show Details'}
  </Button>

      </Card.Body>
  
      <Collapse in={open}>
  <div className={`collapseText ${styles.collapseText}`}>
    <Card.Footer>
      <div className={styles.statsContainer}>
        {/* Top row with first section blank */}
        <div className={styles.statsRow}>
          <div></div> {/* Blank section for alignment */}
          <div>{stakedTokenName}</div>
          <div>{vaultTokenName}</div>
        </div>
        {/* Data rows */}
        <div className={styles.statsRow}>
          <div>Holdings</div>
          <div>{renderBalance(userBalance)}</div>
          <div>{renderBalance(vaultTokenBalance)}</div>
        </div>
        <div className={styles.statsRow}>
          <div>Price</div>
          <div>${priceDisplay}</div>
          <div>$X</div>
        </div>
        <div className={styles.statsRow}>
          <div>Holdings Value</div>
          <div>$Z</div>
          <div>$Y</div>
        </div>
      </div>
    </Card.Footer>
  </div>
</Collapse>








    </Card>
  );
  
};

export default VaultCard;
