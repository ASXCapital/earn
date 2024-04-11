import React, { useState } from 'react';
import styles from './VaultCard.module.css';
import { useAccount, useBalance } from 'wagmi';
import { useTokenBalance } from '../../hooks/useTokenBalance';
import useTokenPrices from '../../hooks/useTokenPrices';
import { VaultCardProps } from '../../types/vaultTypes';
import { formatUnits } from 'ethers/lib/utils';
import { contracts } from '../../config/contracts';
import VaultStakeButton from './VaultStakeButton';
import VaultApproveButton from './VaultApproveButton';
import VaultWithdrawButton from './VaultWithdrawButton';
import VaultStakeButtonBNB from './VaultStakeButtonBNB';
import VaultWithdrawButtonBNB from './VaultWithdrawButtonBNB';
import { Card, Button, Row, Col, Form, Table } from 'react-bootstrap';

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

}) => {
  const { address: userAddress } = useAccount();
  const [stakeAmount, setStakeAmount] = useState('');
  const { data: nativeBalance } = useBalance({ address: userAddress });
  const { data: erc20TokenBalance } = useTokenBalance(stakedTokenContract, userAddress);
  
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

  // Update stake amount based on user input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStakeAmount(e.target.value);
  };

  // Callback function to update UI after staking transaction
  const handleUpdateAfterStake = () => {
    console.log("Update UI after staking");
    // Implement your update logic here
  };
  

  return (
    <Card className="mb-3" style={{ backgroundColor: '#0207077a', color: '#cfcfcf', borderRadius: '10px', boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.2)' }}>
      <Card.Header style={{ backgroundColor: '#020707', color: '#00dab6' }}>{title}</Card.Header>
      <Card.Body>
        <Card.Text>Receive: {receiveToken}</Card.Text>
        <Card.Text>TVL: {tvl}</Card.Text>
        <Card.Text>APY: {apy}%</Card.Text>
        <Form.Group className="mb-3">
          <Form.Control
            type="number"
            value={stakeAmount}
            onChange={handleInputChange}
            placeholder="Amount to stake"
            style={{ backgroundColor: '#020707', color: '#cfcfcf', borderColor: '#ddd' }}
          />
        </Form.Group>


        <Row className="mb-3">
    {/* ERC20 TOKEN VAULTING */}
    {!isNativeToken && (
      <>
        <Col md={6} className="mb-2">
          <VaultApproveButton
            tokenAddress={stakedTokenContract}
            stakingContractAddress={vaultTokenContract}
            onUpdate={handleUpdateAfterStake}
          />
        </Col>
        <Col md={6} className="mb-2">
          <VaultStakeButton
            amount={stakeAmount}
            vaultContractAddress={vaultTokenContract}
            onUpdate={handleUpdateAfterStake}
            tokenAddress={stakedTokenContract}
          />
        </Col>
        <Col md={6} className="mb-2">
          <VaultWithdrawButton
            vaulttokenAddress={vaultTokenContract}
            stakedTokenContract={stakedTokenContract}
            amount={stakeAmount}
            onUpdate={handleUpdateAfterStake}
          />
        </Col>
      </>
    )}

    {/* BNB VAULTING */}
    {isNativeToken && (
      <>
        <Col md={6} className="mb-2">
          <VaultStakeButtonBNB
            amount={stakeAmount}
            vaultContractAddress={vaultTokenContract}
            onUpdate={handleUpdateAfterStake}
          />
        </Col>
        <Col md={6} className="mb-2">
          <VaultWithdrawButtonBNB
            vaultTokenAddress={vaultTokenContract}
            amount={stakeAmount}
            wrap={false} // Assuming you want to pass 'false' for the 'wrap' argument; adjust based on your needs
            onUpdate={handleUpdateAfterStake}
          />
        </Col>
      </>
    )}
  </Row>
</Card.Body>


      <Card.Footer>
        <Table striped bordered hover variant="dark" size="sm">
          <thead style={{ backgroundColor: '#34483c8a', color: '#e0e0e0' }}>
            <tr>
              <th></th>
              <th>{stakedTokenName}</th>
              <th>{vaultTokenName}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Holdings</td>
              <td>{`${renderBalance(userBalance)}`}</td>
              <td>{`${renderBalance(vaultTokenBalance)}`}</td>
            </tr>
            <tr>
              <td>Price</td>
              <td>${priceDisplay}</td>
              <td>$X</td>
            </tr>
            <tr>
              <td>Holdings Val</td>
              <td>$Z</td>
              <td>$Y</td>
            </tr>
          </tbody>
        </Table>
      </Card.Footer>
    </Card>
  );
};

export default VaultCard;