// file: earn/src/components/vaults/VaultStakeButtonBNB.tsx

import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ethers } from 'ethers';
import { ASXVaultsABINative } from '../../abis/ASXVaultsABINative';
import styles from '../../styles/StakingPage.module.css';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';


const VaultStakeButtonBNB = ({ vaultContractAddress, amount, onUpdate }) => { // Change component name
  const [statusMessage, setStatusMessage] = useState('Stake'); // Change status message
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [transactionInitiated, setTransactionInitiated] = useState(false);
  const addRecentTransaction = useAddRecentTransaction();
  const [inputAmount, setInputAmount] = useState('');

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
        setStatusMessage('Stake');
        setTransactionInitiated(false);
      }, 3000);
      onUpdate();
    } else if (isError && transactionInitiated) {
      setStatusMessage('Error');
      setTimeout(() => {
        setStatusMessage('Stake');
        setTransactionInitiated(false);
      }, 3000);
    }
  }, [isSuccess, isError, transactionInitiated, onUpdate]);

  const handleAction = async () => {
    if (isButtonDisabled || isLoading) return;
    setStatusMessage('Staking...');
    setIsButtonDisabled(true);
  
    try {
      // Convert the amount from BNB (Ether) to Wei
      const amountInWei = ethers.utils.parseUnits(amount || '0', 'ether');

      const txResponse = await writeContractAsync({
        abi: ASXVaultsABINative,
        address: vaultContractAddress,
        functionName: 'stake',
        args: [amountInWei], 
        value: amountInWei 
      });
      
      
      // Update transaction state
      setTransactionHash(txResponse); // Use txResponse.hash to capture the transaction hash correctly
      setTransactionInitiated(true);
      addRecentTransaction({
        hash: txResponse, // Use txResponse.hash here as well
        description: 'Vault Deposit BNB',
      });
    } catch (error) {
      console.error('Staking error:', error);
      setStatusMessage('Error');
      setIsButtonDisabled(false);
    } finally {
      setTimeout(() => setStatusMessage('Stake'), 5000); // Reset the button text after a delay
    }
  };
  
  
  
  

  return (
    <div className={styles.buttonWrapper}>
      <button
        className={`${styles.actionButton} ${isButtonDisabled || isLoading ? styles.disabledButton : ''} ${isSuccess && transactionInitiated ? styles.successPulse : isError && transactionInitiated ? styles.errorPulse : ''}`}
        onClick={handleAction}
        disabled={isButtonDisabled || isLoading}
      >
        <div className={styles.buttonContent}>
          <span className={styles.mainText}>{isLoading ? 'Confirming' : statusMessage}</span>
          
        </div>
      </button>
    </div>
  );
};

export default VaultStakeButtonBNB;
