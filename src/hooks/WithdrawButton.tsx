import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ethers } from 'ethers';
import { ASXStakingABI } from '../abis/ASXStakingABI';
import styles from '../styles/StakingPage.module.css';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';


const WithdrawButton = ({ stakingContractAddress, amount, onUpdate }) => {
  const [statusMessage, setStatusMessage] = useState('Withdraw');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [transactionInitiated, setTransactionInitiated] = useState(false);
  const addRecentTransaction = useAddRecentTransaction();

  useEffect(() => {
    setIsButtonDisabled(!amount || amount === '0' || isNaN(amount));
  }, [amount]);

  const { writeContractAsync } = useWriteContract();

  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: transactionHash ? `0x${transactionHash.replace(/^0x/, '')}` : undefined,
  });

  useEffect(() => {
    if (isSuccess && transactionInitiated) {
      setStatusMessage('Success');
      setTimeout(() => {
        setStatusMessage('Withdraw');
        setTransactionInitiated(false);
      }, 3000);
      onUpdate();
    } else if (isError && transactionInitiated) {
      setStatusMessage('Error');
      setTimeout(() => {
        setStatusMessage('Withdraw');
        setTransactionInitiated(false);
      }, 3000);
    }
  }, [isSuccess, isError, transactionInitiated, onUpdate]);

  const handleAction = async () => {
    if (isButtonDisabled || isLoading) return;
    setStatusMessage('Withdrawing');
    setIsButtonDisabled(true);

    try {
      const txResponse = await writeContractAsync({
        abi: ASXStakingABI,
        address: stakingContractAddress,
        functionName: 'withdraw',
        args: [amount ? ethers.utils.parseUnits(amount, 'ether').toString() : '0'],
      });
      setTransactionHash(txResponse); // Corrected to use txResponse.hash
      setTransactionInitiated(true);
      addRecentTransaction({
        hash: txResponse,
        description: 'Withdraw', // Customize this description
      });
    } catch (error) {
      console.error('Withdrawal error:', error);
      setStatusMessage('Error');
      setTimeout(() => {
        setStatusMessage('Withdraw');
      }, 5000);
      setIsButtonDisabled(false);
    }
  };

  return (
    <div>
      <button
        className={`${styles.actionButton} ${isButtonDisabled || isLoading ? styles.disabledButton : ''} ${isSuccess && transactionInitiated ? styles.successPulse : isError && transactionInitiated ? styles.errorPulse : ''}`}
        onClick={handleAction}
        disabled={isButtonDisabled || isLoading}
      >
        <div className={styles.buttonContent}>
          <span className={styles.mainText}>{isLoading ? 'Confirming' : statusMessage}</span>
          <span className={styles.noteInsideButton}>(leave blank for max)</span>
        </div>
      </button>
    </div>
  );
};

export default WithdrawButton;