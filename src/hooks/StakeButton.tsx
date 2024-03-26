import React, { useState, useEffect } from 'react';
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { ethers } from 'ethers';
import { ERC20ABI } from '../abis/ERC20ABI';
import { ASXStakingABI } from '../abis/ASXStakingABI';
import styles from '../styles/StakingPage.module.css';
import { BigNumber } from 'ethers';

const StakeButton = ({ tokenAddress, stakingContractAddress, accountAddress, amount, onUpdate }) => {
  const [statusMessage, setStatusMessage] = useState('Stake');
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [currentAllowance, setCurrentAllowance] = useState(ethers.constants.Zero); // Initialize with Zero

  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [accountAddress, stakingContractAddress],
  });

  useEffect(() => {
    if (allowance) {
      setCurrentAllowance(BigNumber.from(allowance.toString()));
    }
  }, [allowance]);

  useEffect(() => {
    const isAmountInvalid = !amount || parseFloat(amount) <= 0 || isNaN(amount);
    setIsButtonDisabled(isAmountInvalid);

    if (!isAmountInvalid) {
      const requiredAmount = ethers.utils.parseEther(amount || '0');
      const isApprovalNeeded = currentAllowance.lt(requiredAmount);
      setStatusMessage(isApprovalNeeded ? 'Approve' : 'Stake');
    }
  }, [amount, currentAllowance]);

  const { writeContractAsync } = useWriteContract();
  const { data: transactionReceipt } = useWaitForTransactionReceipt();

  useEffect(() => {
    if (transactionReceipt) {
      setStatusMessage('Success!');

      
      onclick=() => setStatusMessage('Stake');
      setTimeout(() => setStatusMessage('Stake'), 3000); // Reset to 'Stake' after a delay
      onUpdate();
    }
  }, [transactionReceipt, onUpdate]);

  const handleAction = async () => {
    setIsButtonDisabled(true);
    const actionType = statusMessage === 'Approve' ? 'Approving...' : 'Staking...';
    setStatusMessage(actionType);

    try {
      const args = statusMessage === 'Approve' ? [stakingContractAddress, ethers.constants.MaxUint256] : [ethers.utils.parseEther(amount)];
      await writeContractAsync({
        abi: statusMessage === 'Approve' ? ERC20ABI : ASXStakingABI,
        address: statusMessage === 'Approve' ? tokenAddress : stakingContractAddress,
        functionName: statusMessage === 'Approve' ? 'approve' : 'stake',
        args,
      });
    } catch (error) {
      console.error('Action error:', error);
      setStatusMessage('Error');
      onclick=() => setStatusMessage('Approve');
      setTimeout(() => setStatusMessage('Approve'), 3000); // Assume 'Approve' is needed after an error
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
