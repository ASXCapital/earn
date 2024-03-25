import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ASXStakingABI } from '../abis/ASXStakingABI';
import styles from '../styles/StakingPage.module.css';

const GetRewardButton = ({ stakingContractAddress, accountAddress, onUpdate }) => {
  const [statusMessage, setStatusMessage] = useState('Claim');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const { writeContractAsync } = useWriteContract();
  const { data: transactionReceipt } = useWaitForTransactionReceipt();

  useEffect(() => {
    if (transactionReceipt) {
      setStatusMessage('Tx. Sent');
        setTimeout(() => {
            setStatusMessage('Claim');
        }, 5000);
      onUpdate(); // Callback to update the parent component state
    }
  }, [transactionReceipt, onUpdate]);

  const handleAction = async () => {
    setIsButtonDisabled(true); // Disable button to prevent multiple clicks
    setStatusMessage('Claiming');

    try {
      await writeContractAsync({
        abi: ASXStakingABI,
        address: stakingContractAddress,
        functionName: 'getReward', // The function name in your contract
        
      });

      setStatusMessage('Tx. Sent');
      onUpdate(); // Trigger parent component update
    } catch (error) {
      console.error('Reward claim error:', error);
      setStatusMessage('Error');
      setTimeout(() => {
        setStatusMessage('Claim');
      }, 5000);
    } finally {
      setIsButtonDisabled(false); // Re-enable button after transaction
    }
  };

  return (
    <div>
      <button
        className={`${styles.actionButton} ${isButtonDisabled ? styles.disabledButton : ''}`}
        onClick={handleAction}
        disabled={isButtonDisabled}
      >
        {statusMessage}
      </button>
    </div>
  );
};

export default GetRewardButton;
