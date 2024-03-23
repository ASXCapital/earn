import React, { useState, useEffect } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import { ERC20ABI } from '../abis/ERC20ABI';
import { ASXStakingABI } from '../abis/ASXStakingABI';
import styles from '../styles/StakingPage.module.css';

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
      if (allowance && amount) {
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
      }
    };

    checkAllowance();
  }, [allowance, amount, approvalUpdated]); // Add `approvalUpdated` as a dependency

  const { writeContract } = useWriteContract();

  const handleButtonClick = async () => {
    setIsProcessing(true);

    try {
      const transactionResponse = await writeContract({
        address: buttonLabel === 'Approve' ? tokenAddress : stakingContractAddress,
        abi: buttonLabel === 'Approve' ? ERC20ABI : ASXStakingABI,
        functionName: buttonLabel === 'Approve' ? 'approve' : 'stake',
        args: buttonLabel === 'Approve' ? [stakingContractAddress, ethers.constants.MaxUint256] : [ethers.utils.parseEther(amount)],
        onSuccess: () => {
          if (buttonLabel === 'Approve') {
            setApprovalUpdated(!approvalUpdated); // Toggle the `approvalUpdated` state to trigger re-check
            refetchAllowance(); // Optionally refetch the allowance
          }
          onUpdate();
        },
      });

      if (typeof transactionResponse === 'undefined') {
        console.error("No transaction response returned");
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
