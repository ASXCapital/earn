import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ASXStakingABI } from '../abis/ASXStakingABI';
import styles from '../styles/StakingPage.module.css';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';


const GetRewardButton = ({ stakingContractAddress, onUpdate }) => {
  const [statusMessage, setStatusMessage] = useState('Claim');
  const [transactionHash, setTransactionHash] = useState('');
  const [transactionInitiated, setTransactionInitiated] = useState(false);
  const addRecentTransaction = useAddRecentTransaction();
  const { writeContractAsync } = useWriteContract();

  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: transactionHash ? `0x${transactionHash.replace(/^0x/, '')}` : undefined,
  });

  useEffect(() => {
    if ((isSuccess || isError) && transactionInitiated) {
      const newStatus = isSuccess ? 'Success' : 'Error';
      setStatusMessage(newStatus);
      setTimeout(() => {
        setStatusMessage('Claim');
        setTransactionInitiated(false); // Reset the flag
      }, isSuccess ? 3000 : 5000);
      onUpdate();
    }
  }, [isSuccess, isError, transactionInitiated, onUpdate]);

  const handleAction = async () => {
    if (isLoading) return; // Avoid initiating a new transaction if one is already in progress
    setTransactionInitiated(true); // Set flag to indicate transaction has started
    setStatusMessage('Claiming...');

    try {
      const txResponse = await writeContractAsync({
        abi: ASXStakingABI,
        address: stakingContractAddress,
        functionName: 'getReward',
      });
      setTransactionHash(txResponse);
      addRecentTransaction({
        hash: txResponse,
        description: 'Claim', // Customize this description
      }); // Ensure to use txResponse.hash for the transaction hash
    } catch (error) {
      console.error('Reward claim error:', error);
      setStatusMessage('Error');
      setTimeout(() => setStatusMessage('Claim'), 5000);
      setTransactionInitiated(false); // Reset the flag in case of error
    }
  };

  return (
    <div className={styles.buttonWrapper}>
      <button
        className={`${styles.actionButton} ${isLoading ? styles.disabledButton : ''} ${isSuccess && transactionInitiated ? styles.successPulse : isError && transactionInitiated ? styles.errorPulse : ''}`}
        onClick={handleAction}
        disabled={isLoading} // Only disable the button if a transaction is currently being processed
      >
        <div className={styles.buttonContent}>
          <span className={styles.mainText}>{isLoading ? 'Confirming...' : statusMessage}</span>
        </div>
      </button>
    </div>
  );
};

export default GetRewardButton;
