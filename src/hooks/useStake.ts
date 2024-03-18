import { useState, useCallback } from 'react';
import { ethers, Contract } from 'ethers';

// Define the expected types for your contract instances
// Adjust these types based on your actual contracts
interface StakingContract extends Contract {
  stake: (amount: ethers.BigNumber) => Promise<ethers.ContractTransaction>;
}

interface TokenContract extends Contract {
  approve: (spender: string, amount: ethers.BigNumber) => Promise<ethers.ContractTransaction>;
  allowance: (owner: string, spender: string) => Promise<ethers.BigNumber>;
}

const useStaking = (
  stakingContract: StakingContract,
  tokenContract: TokenContract,
  account: string
) => {
  const [status, setStatus] = useState<'idle' | 'checking' | 'approving' | 'staking' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const checkAllowance = useCallback(async () => {
    setStatus('checking');
    const allowance = await tokenContract.allowance(account, stakingContract.address);
    return !allowance.isZero();
  }, [account, stakingContract.address, tokenContract]);

  const approve = useCallback(async () => {
    try {
      setStatus('approving');
      const tx = await tokenContract.approve(stakingContract.address, ethers.constants.MaxUint256);
      await tx.wait();
      setStatus('idle');
    } catch (error: any) {
      console.error('Approval error:', error);
      setError(error.message);
      setStatus('error');
    }
  }, [stakingContract.address, tokenContract]);

  const stake = useCallback(async (amount: string) => {
    try {
      const hasAllowance = await checkAllowance();
      if (!hasAllowance) {
        await approve();
      }
      setStatus('staking');
      const tx = await stakingContract.stake(ethers.utils.parseUnits(amount, 'ether'));
      await tx.wait();
      setStatus('success');
    } catch (error: any) {
      console.error('Staking error:', error);
      setError(error.message);
      setStatus('error');
    }
  }, [approve, checkAllowance, stakingContract]);

  return { stake, status, error };
};

export default useStaking;
