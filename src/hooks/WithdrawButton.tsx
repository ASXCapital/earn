import React, { useState, useEffect } from 'react';
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { ethers } from 'ethers';
import { ASXStakingABI } from '../abis/ASXStakingABI';
import styles from '../styles/StakingPage.module.css';

const WithdrawButton = ({ stakingContractAddress, accountAddress, amount, onUpdate }) => {
  const [statusMessage, setStatusMessage] = useState('Withdraw');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useEffect(() => {
    const isAmountInvalid = !amount || amount === '0' || isNaN(amount);
    setIsButtonDisabled(isAmountInvalid);
  }, [amount]);

  const { writeContractAsync } = useWriteContract();
  const { data: transactionReceipt } = useWaitForTransactionReceipt();

  useEffect(() => {
    if (transactionReceipt) {
      setStatusMessage('Tx. Sent');
      setTimeout(() => {
        setStatusMessage('Withdraw');
      }, 5000);
      onUpdate();
    }
  }, [transactionReceipt, onUpdate]);

  const handleAction = async () => {
    if (isButtonDisabled) return; // Prevent action if button is disabled

    setIsButtonDisabled(true);
    setStatusMessage('Withdrawing');

    try {
      const args = [ethers.utils.parseEther(amount)];
      await writeContractAsync({
        abi: ASXStakingABI,
        address: stakingContractAddress,
        functionName: 'withdraw', // Replace 'withdraw' with your contract's withdraw function name
        args,
      });

    } catch (error) {
      console.error('Withdrawal error:', error);
      setStatusMessage('Error');
      setTimeout(() => {
        setStatusMessage('Withdraw');
      }, 5000);
    } finally {
      setIsButtonDisabled(false);
    }
  };


return (
  <div>
    <button
      className={`${styles.actionButton} ${isButtonDisabled ? styles.disabledButton : ''}`}
      onClick={handleAction}
      disabled={isButtonDisabled}
    >
      {/* Wrapper div for button content using flexbox */}
      <div className={styles.buttonContent}>
        {/* Main text */}
        <span className={styles.mainText}>{statusMessage}</span>
        {/* Smaller note */}
        <span className={styles.noteInsideButton}>(leave blank for max)</span>
      </div>
    </button>
  </div>
);



};

export default WithdrawButton;
