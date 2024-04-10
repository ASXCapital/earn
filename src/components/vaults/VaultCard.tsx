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
  
console.log("stakedTokenContract", stakedTokenContract)
console.log("vaultTokenContract", vaultTokenContract)
  return (
    <div className={styles.vaultCardContainer}>
      <h2 className={styles.vaultTitle}>{title}</h2>
      <div className={styles.vaultDetails}>
        <p>Receive: {receiveToken}</p>
        <p>TVL: {tvl}</p>
        <p>APY: {apy}%</p>
        <input 
        type="number" 
        value={stakeAmount} 
        onChange={handleInputChange} 
        placeholder="Amount to stake" 
        className={styles.inputField} 
      />
        <div className={styles.actionButtons}>


        {/*ERC20 TOKEN VAULTING*/}

        {!isNativeToken && (
          <VaultApproveButton
            tokenAddress={stakedTokenContract}
            stakingContractAddress={vaultTokenContract}
            onUpdate={handleUpdateAfterStake}
          />
        )}
          {!isNativeToken && (
          <VaultStakeButton 
            amount={stakeAmount} 
            vaultContractAddress={vaultTokenContract} 
            onUpdate={handleUpdateAfterStake} 
            tokenAddress={stakedTokenContract}
          />
        )}
          
          <VaultWithdrawButton
            vaulttokenAddress={vaultTokenContract} 
            stakedTokenContract={stakedTokenContract}
            amount={stakeAmount} 
            onUpdate={handleUpdateAfterStake} 
          />
       








        </div>
      </div>
      <div className={styles.userStats}>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>{stakedTokenName}</th>
              <th>{vaultTokenName}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Holdings</td>
              <td>{`${renderBalance(userBalance)} ${stakedTokenName}`}</td>
              <td>{`${renderBalance(vaultTokenBalance)} ${vaultTokenName}`}</td>
            </tr>
            <tr>
              <td>Price</td>
              <td>${priceDisplay}</td>
              <td>$X (Placeholder)</td>
            </tr>
            <tr>
              <td>Holdings Val</td>
              <td>$Z (Placeholder)</td>
              <td>$Y (Placeholder)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VaultCard;