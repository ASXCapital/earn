{/*


import React, { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import { ASXStakingABI } from '../abis/ASXStakingABI'; // Adjust the import path as necessary

interface WithdrawButtonProps {
  stakingContractAddress: string;
  accountAddress: string; // Assuming you need the user's account address
  amount: string; // Now accepting amount as prop
}

const WithdrawButton: React.FC<WithdrawButtonProps> = ({ stakingContractAddress, accountAddress }) => {
  const [amount, setAmount] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string>('');

  const { writeContract, isLoading } = useWriteContract({
    address: stakingContractAddress,
    abi: ASXStakingABI,
    functionName: 'withdraw',
    args: [accountAddress, ethers.utils.parseUnits(amount || '0', 'ether')], // Adjust args according to your contract's withdraw function
    onError: (error) => {
      console.error('Withdrawal error:', error);
      setWithdrawError(error.message);
      setIsWithdrawing(false);
    },
    onSuccess: () => {
      console.log('Withdrawal successful');
      setIsWithdrawing(false);
      setAmount(''); // Reset amount after successful withdrawal
    },
  });

const handleWithdraw = async () => {
    if (!amount || isLoading) return;
    setIsWithdrawing(true);
    setWithdrawError('');
    writeContract({});
};

  return (
    <div>
      <input
        type="text"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount to withdraw"
        disabled={isWithdrawing}
      />
      <button onClick={handleWithdraw} disabled={isWithdrawing || !amount}>
        {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
      </button>
      {withdrawError && <p className="error">{withdrawError}</p>}
    </div>
  );
};

export default WithdrawButton;

*/}