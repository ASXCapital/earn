import React, { useState, useEffect } from 'react';
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { ethers } from 'ethers';
import { ERC20ABI } from '../abis/ERC20ABI';
import { ASXStakingABI } from '../abis/ASXStakingABI';
import styles from '../styles/StakingPage.module.css';

const StakeButton = ({ tokenAddress, stakingContractAddress, accountAddress, amount, onUpdate }) => {
  const [statusMessage, setStatusMessage] = useState('Stake');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [accountAddress, stakingContractAddress],
  });

  useEffect(() => {
    const isAmountInvalid = !amount || amount === '0' || isNaN(amount);
    setIsButtonDisabled(isAmountInvalid);

    if (allowance && !isAmountInvalid) {
      const formattedAllowance = ethers.BigNumber.from(allowance.toString());
      const requiredAmount = ethers.utils.parseEther(amount);
      const isApprovalNeeded = formattedAllowance.lt(requiredAmount);
      setStatusMessage(isApprovalNeeded ? 'Approve' : 'Stake');
    }
  }, [allowance, amount]);

  const { writeContractAsync } = useWriteContract();
  const { data: transactionReceipt } = useWaitForTransactionReceipt();

  useEffect(() => {
    if (transactionReceipt) {
      setStatusMessage('Tx. Sent');
      setTimeout(() => {
        setStatusMessage(statusMessage === 'Approve' ? 'Stake' : 'Approve');
      }, 5000);
      onUpdate();
    }
  }, [transactionReceipt, onUpdate]);

  const handleAction = async () => {
    if (isButtonDisabled) return; // Prevent action if button is disabled

    setIsButtonDisabled(true);
    

    try {
      const args = statusMessage === 'Approve' ? [stakingContractAddress, ethers.constants.MaxUint256.toString()] : [ethers.utils.parseEther(amount)];
      await writeContractAsync({
        abi: statusMessage === 'Approve' ? ERC20ABI : ASXStakingABI,
        address: statusMessage === 'Approve' ? tokenAddress : stakingContractAddress,
        functionName: statusMessage === 'Approve' ? 'approve' : 'stake',
        args,
      });

    } catch (error) {
      console.error('Action error:', error);
      setStatusMessage('Error');
      setTimeout(() => {
        setStatusMessage(statusMessage === 'Approve' ? 'Stake' : 'Approve');
      }, 3000);
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
        {statusMessage}
      </button>
    </div>
  );
};

export default StakeButton;
