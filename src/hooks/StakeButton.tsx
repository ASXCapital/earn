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
  console.log('tokenAddress', tokenAddress)
  console.log('stakingContractAddress', stakingContractAddress)
  console.log('accountAddress', accountAddress)
  console.log('amount', amount)
  console.log('onUpdate', onUpdate)


  useEffect(() => {
    const checkAllowance = async () => {
      console.log('[checkAllowance] Start: allowance, amount', allowance, amount); // Log at the start
  
      if (allowance !== undefined && amount) {
        const isValidAmount = !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
        console.log('[checkAllowance] isValidAmount', isValidAmount); // Log the validity of the amount
  
        if (isValidAmount) {
          const formattedAllowance = ethers.BigNumber.from(allowance.toString());
          const requiredAmount = ethers.utils.parseEther(amount);
          const needsApproval = formattedAllowance.lt(requiredAmount);
  
          console.log('[checkAllowance] formattedAllowance, requiredAmount, needsApproval', formattedAllowance.toString(), requiredAmount.toString(), needsApproval); // Log allowance-related values
        
          setButtonLabel(needsApproval ? 'Approve' : 'Stake');
          setButtonDisabled(false);
        } else {
          console.log('[checkAllowance] Invalid Amount:', amount);
          setButtonDisabled(true);
        }
      } else {
        console.log('[checkAllowance] Missing allowance or invalid amount:', allowance, amount);
        // Additional logic here for handling missing allowance or invalid amount
      }
    };
  
    checkAllowance();
  }, [allowance, amount, approvalUpdated]);
  

  const { writeContract } = useWriteContract();

  const handleButtonClick = async () => {
    setIsProcessing(true);
    console.log('[handleButtonClick] Start: buttonLabel, amount', buttonLabel, amount); // Log at the start
  
    try {
      // Destructuring to get the write function from the useWriteContract hook
      const writeContractResult: any = writeContract({
        address: buttonLabel === 'Approve' ? tokenAddress : stakingContractAddress,
        abi: buttonLabel === 'Approve' ? ERC20ABI : ASXStakingABI,
        functionName: buttonLabel === 'Approve' ? 'approve' : 'stake',
        args: buttonLabel === 'Approve'
          ? [stakingContractAddress, ethers.constants.MaxUint256]
          : [ethers.utils.parseEther(amount)],
      });
      console.log( '[handleButtonClick] writeContractResult', writeContractResult)

      const { write } = writeContractResult;
  
      if (write) {
        // Call the write function to execute the contract interaction
        const transactionResponse = await write({
          onSuccess: () => {
            if (buttonLabel === 'Approve') {
              setApprovalUpdated(!approvalUpdated);
              refetchAllowance();
            }
            onUpdate();
          },
        });
  
        if (typeof transactionResponse === 'undefined') {
          console.error("No transaction response returned");
        }
      } else {
        console.error("write function is not available");
      }
    } catch (error) {
      console.error("Transaction error:", error);
    } finally {
      setIsProcessing(false);
    }
  };
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
