import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { ethers } from 'ethers';
import styles from '../../styles/StakingPage.module.css';
import { ERC20ABI } from '../../abis/ERC20ABI';
import { ASXVaultsABI } from '../../abis/ASXVaultsABI';
import { ASXVaultsABINative } from '../../abis/ASXVaultsABINative';

const VaultStakeButton = ({ tokenAddress, stakingContractAddress, amount }) => {
  const [statusMessage, setStatusMessage] = useState('Stake');
  const [transactionHash, setTransactionHash] = useState('');
  const { address: userAddress } = useAccount();
  const { writeAsync: writeContractAsync } = useWriteContract();

  const isNativeStake = !tokenAddress || tokenAddress === ethers.constants.AddressZero;

  useEffect(() => {
    const checkTransactionStatus = async () => {
      if (transactionHash) {
        setStatusMessage('Processing...');
      }
    };

    checkTransactionStatus();
  }, [transactionHash]);

  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  useEffect(() => {
    if (isSuccess) {
      setStatusMessage('Success!');
    } else if (isError) {
      setStatusMessage('Error');
    }
  }, [isLoading, isSuccess, isError]);

  const handleStake = async () => {
    if (!amount || amount === '0' || isNaN(amount)) {
      setStatusMessage('Invalid amount');
      return;
    }

    const contractInterface = isNativeStake ? ASXVaultsABINative : ASXVaultsABI;
    const functionName = isNativeStake ? 'stakeBNB' : 'stakeToken';
    const args = isNativeStake ? [userAddress] : [userAddress, ethers.utils.parseEther(amount), tokenAddress];
    const overrides = isNativeStake ? { value: ethers.utils.parseEther(amount) } : {};

    try {
      setStatusMessage('Staking...');
      const txResponse = await writeContractAsync({
        addressOrName: stakingContractAddress,
        contractInterface: contractInterface,
        functionName: functionName,
        args: args,
        overrides: overrides,
      });
      setTransactionHash(txResponse.hash);
    } catch (error) {
      console.error('Staking error:', error);
      setStatusMessage('Error');
    }
  };

  const isButtonDisabled = !amount || amount === '0' || isNaN(amount) || isLoading;

  return (
    <div className={styles.buttonWrapper}>
      <button
        className={`${styles.actionButton} ${isButtonDisabled || isLoading ? styles.disabledButton : ''}`}
        onClick={handleStake}
        disabled={isButtonDisabled || isLoading}
      >
        {statusMessage}
      </button>
    </div>
  );
};

export default VaultStakeButton;
