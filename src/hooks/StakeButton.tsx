import React, { useState, useEffect } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import { ERC20ABI } from '../abis/ERC20ABI';
import { ASXStakingABI } from '../abis/ASXStakingABI';
import styles from '../styles/StakingPage.module.css';

interface StakeButtonProps {
  tokenAddress: string;
  stakingContractAddress: string;
  accountAddress: string;
  amount: string;
  onUpdate: () => void; // Callback prop for updating figures
}

const StakeButton: React.FC<StakeButtonProps> = ({
  tokenAddress,
  stakingContractAddress,
  accountAddress,
  amount,
  onUpdate, // Receive the callback as a prop
}) => {
  const [needsApproval, setNeedsApproval] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transactionError, setTransactionError] = useState<string>('');
  const [transactionHash, setTransactionHash] = useState<string>('');

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [accountAddress as `0x${string}`, stakingContractAddress as `0x${string}`],
  });

  const { writeContract } = useWriteContract();

  useEffect(() => {
    if (allowance && amount) {
      const formattedAllowance = ethers.BigNumber.from(allowance.toString());
      const requiredAmount = ethers.utils.parseEther(amount);
      setNeedsApproval(formattedAllowance.lt(requiredAmount));
    }
  }, [allowance, amount]);

  const handleButtonClick = async () => {
    setIsProcessing(true);
    setTransactionError('');
    setTransactionHash('');

    if (needsApproval) {
      // Approval logic
      try {
        const { wait } = await writeContract({
          address: tokenAddress,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [stakingContractAddress, ethers.constants.MaxUint256],
        });
        const receipt = await wait();
        if (receipt.status === 1) {
          setTransactionHash(receipt.transactionHash);
          refetchAllowance(); // Refetch the allowance to update the UI
        } else {
          setTransactionError('Approval transaction failed');
        }
      } catch (error) {
        console.error(error);
        setTransactionError('Approval failed: ' + error.message);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Staking logic
      try {
        const { wait } = await writeContract({
          address: stakingContractAddress,
          abi: ASXStakingABI,
          functionName: 'stake',
          args: [ethers.utils.parseEther(amount || '0')],
        });
        const receipt = await wait();
        if (receipt.status === 1) {
          setTransactionHash(receipt.transactionHash);
          onUpdate(); // Call the update callback after successful staking
        } else {
          setTransactionError('Staking transaction failed');
        }
      } catch (error) {
        console.error(error);
        setTransactionError('Staking failed: ' + error.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div>
      <button
        className={styles.actionButton}
        onClick={handleButtonClick}
        disabled={isProcessing || !amount || parseFloat(amount) <= 0}
      >
        {isProcessing ? 'Processing...' : needsApproval ? 'Approve' : 'Stake'}
      </button>
      
    </div>
  );
};

export default StakeButton;
