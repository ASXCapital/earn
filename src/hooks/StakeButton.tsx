import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { ERC20ABI } from '../abis/ERC20ABI';
import { ASXStakingABI } from '../abis/ASXStakingABI';
import styles from '../styles/StakingPage.module.css';
import { BigNumber } from 'ethers';

const StakeButton = ({ tokenAddress, stakingContractAddress, amount, onUpdate }) => {
  const [statusMessage, setStatusMessage] = useState('Approve');
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [transactionHash, setTransactionHash] = useState(undefined);  // Use undefined initially
  const [transactionInitiated, setTransactionInitiated] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(true);
  const [currentAllowance, setCurrentAllowance] = useState(ethers.constants.Zero); // Corrected line here

  const { address: userAddress } = useAccount();

  const { writeContractAsync } = useWriteContract();
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({ hash: transactionHash });

  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [userAddress, stakingContractAddress],
  });

  useEffect(() => {
    if (allowance) {
      setCurrentAllowance(BigNumber.from(allowance.toString())); // Use BigNumber for allowance
    }
  }, [allowance]);

  useEffect(() => {
    const requiredAmount = ethers.utils.parseEther(amount || '0');
    const approvalNeeded = currentAllowance.lt(requiredAmount);
    setNeedsApproval(approvalNeeded);
    setIsButtonDisabled(!amount || amount === '0' || isNaN(amount) || isLoading);
    setStatusMessage(approvalNeeded ? 'Approve' : 'Stake');
  }, [amount, currentAllowance, isLoading, needsApproval]);

  useEffect(() => {
    if (isSuccess && transactionInitiated) {
      setStatusMessage('Success');
      setTimeout(() => {
        setStatusMessage(needsApproval ? 'Approve' : 'Stake');
        setTransactionInitiated(false);
        onUpdate();
      }, 3000);
    } else if (isError && transactionInitiated) {
      setStatusMessage('Error');
      setTimeout(() => {
        setStatusMessage(needsApproval ? 'Approve' : 'Stake');
        setTransactionInitiated(false);
      }, 3000);
    }
  }, [isSuccess, isError, transactionInitiated, onUpdate, needsApproval]);

  const handleAction = async () => {
    if (isButtonDisabled || isLoading) return;

    try {
      let txResponse;
      if (needsApproval) {
        setStatusMessage('Approving...');
        txResponse = await writeContractAsync({
          abi: ERC20ABI,
          address: tokenAddress,
          functionName: 'approve',
          args: [stakingContractAddress, ethers.constants.MaxUint256.toString()],
        });
      } else {
        setStatusMessage('Staking...');
        txResponse = await writeContractAsync({
          abi: ASXStakingABI,
          address: stakingContractAddress,
          functionName: 'stake',
          args: [ethers.utils.parseEther(amount)],
        });
      }
      setTransactionHash(txResponse.hash); // Directly use the transaction hash
      setTransactionInitiated(true);
    } catch (error) {
      console.error('Transaction error:', error);
      setStatusMessage('Error');
      setTimeout(() => setStatusMessage(needsApproval ? 'Approve' : 'Stake'), 5000);
    }
  };

  return (
    <div>
      <button
        className={`${styles.actionButton} ${isButtonDisabled || isLoading ? styles.disabledButton : ''} ${isSuccess && transactionInitiated ? styles.successPulse : isError && transactionInitiated ? styles.errorPulse : ''}`}
        onClick={handleAction}
        disabled={isButtonDisabled || isLoading}
      >
        {isLoading ? 'Processing...' : statusMessage}
      </button>
    </div>
  );
};

export default StakeButton;
