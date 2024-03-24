import React, { useState, useEffect } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import { ERC20ABI } from '../abis/ERC20ABI';
import { ASXStakingABI } from '../abis/ASXStakingABI';
import styles from '../styles/StakingPage.module.css';
import { log } from 'console';

const StakeButton = ({
  tokenAddress,
  stakingContractAddress,
  accountAddress,
  amount,
  onUpdate,
}) => {
  const [buttonLabel, setButtonLabel] = useState('Stake');
  const [isProcessing, setIsProcessing] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [approvalUpdated, setApprovalUpdated] = useState(false); // New state to track approval updates

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [accountAddress, stakingContractAddress],
  });


  useEffect(() => {
    const checkAllowance = async () => {
  
      if (allowance !== undefined && amount) {
        const isValidAmount = !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
  
        if (isValidAmount) {
          const formattedAllowance = ethers.BigNumber.from(allowance.toString());
          const requiredAmount = ethers.utils.parseEther(amount);
          const needsApproval = formattedAllowance.lt(requiredAmount);
  
        
          setButtonLabel(needsApproval ? 'Approve' : 'Stake');
          setButtonDisabled(false);
        } else {
          setButtonDisabled(true);
        }
      } else {
        // Additional logic here for handling missing allowance or invalid amount
      }
    };
  
    checkAllowance();
  }, [allowance, amount, approvalUpdated]);
  
  const [inputValue, setInputValue] = useState('');
  const { writeContract } = useWriteContract();

  const handleButtonClick = async () => {
    setIsProcessing(true);
    console.log('[handleButtonClick] Start: buttonLabel, amount', buttonLabel, amount);
  
    try {
      const transactionResponse = writeContract({
        abi: buttonLabel === 'Approve' ? ERC20ABI : ASXStakingABI,
        address: buttonLabel === 'Approve' ? tokenAddress : stakingContractAddress,
        functionName: buttonLabel === 'Approve' ? 'approve' : 'stake',
        args: buttonLabel === 'Approve'
          ? [stakingContractAddress, ethers.constants.MaxUint256]
          : [ethers.utils.parseEther(amount)],
      });
  
      console.log('[handleButtonClick] Transaction Response:', transactionResponse);
  
      if (transactionResponse !== undefined) {
        if (buttonLabel === 'Approve') {
          setApprovalUpdated(!approvalUpdated);
          refetchAllowance();
        }
        onUpdate();
      } else {
        console.error("[handleButtonClick] No transaction response returned.");
      }
    } catch (error) {
      console.error("[handleButtonClick] Transaction error:", error);
    } finally {
      setIsProcessing(false);
    }
  };
console.log({buttonLabel, amount, buttonDisabled, isProcessing, approvalUpdated})

console.log('[StakeButton] Render: buttonLabel, amount, buttonDisabled, isProcessing', buttonLabel, amount, buttonDisabled, isProcessing)
  return (
    <div>
      <button
        className={`${styles.actionButton} ${buttonDisabled || isProcessing ? styles.disabledButton : ''}`}
        onClick={handleButtonClick}
        disabled={buttonDisabled || isProcessing}
        title={buttonDisabled ? 'Enter an amount to proceed' : ''}
      >
        {isProcessing ? 'Processing...' : buttonLabel}
      </button>
    </div>
  );
};

export default StakeButton;
