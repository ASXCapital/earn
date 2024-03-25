import React, { useState, useEffect } from 'react';
import { useWriteContract, useReadContract } from 'wagmi';
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
    if (allowance && amount) {
      const formattedAllowance = ethers.BigNumber.from(allowance.toString());
      const requiredAmount = ethers.utils.parseEther(amount || '0');
      const isApprovalNeeded = formattedAllowance.lt(requiredAmount);
      setStatusMessage(isApprovalNeeded ? 'Approve' : 'Stake');
    }
  }, [allowance, amount]);

  const { writeContractAsync } = useWriteContract();

  const handleAction = async () => {
    setIsButtonDisabled(true);
    setStatusMessage(`${statusMessage === 'Approve' ? 'Approving' : 'Staking'}...`);

    try {
      const args = statusMessage === 'Approve' ? [stakingContractAddress, ethers.constants.MaxUint256.toString()] : [ethers.utils.parseEther(amount || '0')];
      await writeContractAsync({
        abi: statusMessage === 'Approve' ? ERC20ABI : ASXStakingABI,
        address: statusMessage === 'Approve' ? tokenAddress : stakingContractAddress,
        functionName: statusMessage === 'Approve' ? 'approve' : 'stake',
        args,
      }, {
        onSuccess: (data) => {
          console.log('Transaction successful:', data);
          setStatusMessage('Success!');
          onUpdate();
        },
        onError: (error) => {
          console.error('Transaction error:', error);
          setStatusMessage('Error');
        },
      });
    } catch (error) {
      console.error('Action error:', error);
      setStatusMessage('Error');
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
