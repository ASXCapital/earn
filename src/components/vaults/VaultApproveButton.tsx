import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, } from 'wagmi';
import { ERC20ABI } from '../../abis/ERC20ABI';
import styles from '../../styles/StakingPage.module.css';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';

const VaultApproveButton = ({ tokenAddress, stakingContractAddress, onUpdate }) => {
  const [statusMessage, setStatusMessage] = useState('Approve');
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
        setStatusMessage('Approve');
        setTransactionInitiated(false); // Reset the flag
        if (isSuccess) onUpdate(); // Invoke onUpdate callback only if the transaction was successful
      }, isSuccess ? 3000 : 5000); // Adjust timeout as needed
    }
  }, [isSuccess, isError, transactionInitiated, onUpdate]);

  const handleApprove = async () => {
    if (isLoading) return; // Prevent new transaction if one is already in progress
    setTransactionInitiated(true);
    setStatusMessage('Approving...');

    try {
      const txResponse = await writeContractAsync({
        abi: ERC20ABI,
        address: tokenAddress,
        functionName: 'approve',
        args: [stakingContractAddress, ethers.constants.MaxUint256.toString()],
      });
      setTransactionHash(txResponse); // Here txResponse is directly set as transactionHash
      addRecentTransaction({
        hash: txResponse, // txResponse is used directly, assuming it's the transaction hash
        description: 'Vault Approval',
      });
    } catch (error) {
      console.error('Approval error:', error);
      setStatusMessage('Error');
      setTimeout(() => setStatusMessage('Approve'), 5000); // Reset status message after displaying the error
      setTransactionInitiated(false); // Reset the transaction initiated flag in case of error
    }
  };

  return (
    <div className={styles.buttonWrapper}>
      <button
        className={`${styles.actionButton} ${isLoading ? styles.disabledButton : ''} ${isSuccess && transactionInitiated ? styles.successPulse : isError && transactionInitiated ? styles.errorPulse : ''}`}
        onClick={handleApprove}
        disabled={isLoading} // Button is disabled while transaction is in progress
      >
        {isLoading ? 'Confirming...' : statusMessage}
      </button>
    </div>
  );
};

export default VaultApproveButton;
