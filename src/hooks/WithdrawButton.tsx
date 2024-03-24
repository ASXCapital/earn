


import React, { useState } from 'react';
import { useWriteContract, UseWriteContractParameters, UseWriteContractReturnType } from 'wagmi';
import { ethers } from 'ethers';
import { ASXStakingABI } from '../abis/ASXStakingABI'; // Adjust the import path as necessary

// Define the parameters for the WithdrawButton component

interface WithdrawButtonParameters extends UseWriteContractParameters {
  amount: string;
}

// Start the WithdrawButton component
const WithdrawButton: React.FC<WithdrawButtonParameters> = ({ amount, ...rest }) => {
  const [buttonLabel, setButtonLabel] = useState('Withdraw');
  const [isProcessing, setIsProcessing] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);

  const { writeContract } = useWriteContract();

  const handleButtonClick = async () => {
    setIsProcessing(true);
    console.log('[handleButtonClick] Start: buttonLabel, amount', buttonLabel, amount);

    try {
      const tx = await writeContract({
        ...rest,
        functionName: 'withdraw',
        args: [ethers.utils.parseEther(amount)],
      });

      console.log('[handleButtonClick] tx', tx);
      setIsProcessing(false);
    } catch (error) {
      console.error('[handleButtonClick] error', error);
      setIsProcessing(false);
    }
  };

  return (
    <button
      
      onClick={handleButtonClick}
      disabled={buttonDisabled || isProcessing}
    >
      {isProcessing ? 'Processing...' : buttonLabel}
    </button>
  );
};
export default WithdrawButton;