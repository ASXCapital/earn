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
          borderTopLeftRadius: 0, 
          borderBottomLeftRadius: 0, 
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
    <Card className="mb-3" style={{ 
      margin: '0 0 0 0' , 
      backgroundColor: '#0207077a', 
      color: '#cfcfcf', 
      borderRadius: '10px', 
      boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.2)',
      
      
      }}>
       <div>
            
            
        </div>
      
      <Card.Header style={{ backgroundColor: '#020707', color: '#00dab6' }}>{stakedTokenName}</Card.Header>
      <Card.Body
      style={{ padding: '10px', margin: '0px'}}
      >
        <Card.Text>Receive: {receiveToken}</Card.Text>
        <TVLAndAPRDisplay poolId={poolId} />
        <Form.Group as={Col} className="mb-3">
          
          <InputGroup>
            <Form.Control
              type="text"
              value={stakeAmount}
              onChange={handleInputChange}
              placeholder="Amount to stake"
              style={{ backgroundColor: '#020707', color: '#cfcfcf', borderColor: '#ddd' }}
            />
            {isNativeToken ? (
              <MaxButton />
            ) : (
              <Button
                variant="outline-secondary"
                onClick={setMaxAmount}
                style={{
                  color: 'black',
                  backgroundColor: 'white',
                  zIndex: 1,
                  borderColor: '#ddd',
                  borderTopLeftRadius: 0, 
                  borderBottomLeftRadius: 0, 
                }}
              >
                Max
              </Button>
            )}
          </InputGroup>
        </Form.Group>
        <Row className="mb-3">

    {/* ERC20 TOKEN VAULTING */}
    {!isNativeToken && (
      <>
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
        <Col md={6} className="mb-2">
          <VaultApproveButton
            tokenAddress={stakedTokenContract}
            stakingContractAddress={vaultTokenContract}
            onUpdate={handleUpdateAfterStake}
          />
        </Col>
        <Col md={6} className="mb-2">
        <Button
        onClick={() => setOpen(!open)}
        aria-controls="collapse-text"
        aria-expanded={open}
        variant="outline-info"
        style={{ margin: '0px', fontSize: '16px', padding: '2px', width: '100%', borderRadius: '0px',
height: '31px', alignContent: 'center'

        }}
      >
        {open ? 'Hide Details' : 'Show Details'}
      </Button>
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
        
        <Col md={12} className="mb-2">
        <Button
        onClick={() => setOpen(!open)}
        aria-controls="collapse-text"
        aria-expanded={open}
        variant="outline-info"
        style={{ margin: '0px', fontSize: '16px', padding: '2px', width: '100%', borderRadius: '0px',
        height: '31px', alignContent: 'center'

        }}
      >
        {open ? 'Hide Details' : 'Show Details'}
      </Button>
        </Col>
      </>
    )}
  </Row>
  

    </Card.Body>

    <Collapse in={open}>
      <div id="collapse-text">
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
                <td>{renderBalance(userBalance)}</td>
                <td>{renderBalance(vaultTokenBalance)}</td>
              </tr>
              <tr>
                <td>Price</td>
                <td>${priceDisplay}</td>
                <td>$X</td>
              </tr>
              <tr>
                <td>Holdings Value</td>
                <td>$Z</td>
                <td>$Y</td>
              </tr>
            </tbody>
          </Table>
        </Card.Footer>
      </div>
    </Collapse>
  </Card>
);
};

export default VaultCard;