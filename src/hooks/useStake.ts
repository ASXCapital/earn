import { writeContract } from '@wagmi/core';
import { ethers, Signer } from 'ethers';
import { ASXStakingABI } from '../abis/ASXStakingABI';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';


export const useStake = (stakingContractAddress: string, providerOrSigner: Signer | ethers.providers.Provider) => {
  const stakeTokens = async (amount: string) => {
    const amountToStake = ethers.utils.parseUnits(amount, 'ether');

    const config = {
      addressOrName: stakingContractAddress,
      contractInterface: ASXStakingABI,
      functionName: 'stake',
      args: [amountToStake],
    };

    try {
      const result = await writeContract(getDefaultConfig(config as any), providerOrSigner as any);
      console.log('Stake transaction result:', result);
      return result;
    } catch (error) {
      console.error('Error staking tokens:', error);
      throw error;
    }
  };

  return stakeTokens;
};
