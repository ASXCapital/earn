import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useTVL } from './useTVL';
import { useERC20TotalSupply } from './useERC20TotalSupply';
import { useTotalStaked } from './useTotalStaked';
import { useStakedAmount } from './useStakedAmount';

export const useVTokenPrice = (vaultTokenAddress, stakingContractAddress, poolId) => {
    const [vTokenPrice, setVTokenPrice] = useState('Calculating...');
    const tvl = useTVL(poolId);
    const { totalSupply } = useERC20TotalSupply(vaultTokenAddress);
    const totalStakedInPool = useTotalStaked(stakingContractAddress).totalStaked;
    const individualStakedAmount = useStakedAmount(stakingContractAddress, vaultTokenAddress).data || 0n;

    useEffect(() => {
        if (typeof tvl === 'number' && totalSupply && totalStakedInPool !== undefined && individualStakedAmount !== undefined && tvl > 0) {
            try {
                const tvlScaled = ethers.utils.parseUnits(tvl.toString(), 18);
                const totalSupplyBigNumber = ethers.BigNumber.from(totalSupply);
                const individualStakedBigNumber = ethers.BigNumber.from(individualStakedAmount.toString());
                const totalStakedBigNumber = ethers.BigNumber.from(totalStakedInPool.toString());

                if (!totalStakedBigNumber.isZero() && !totalSupplyBigNumber.isZero() && !individualStakedBigNumber.isZero()) {
                    const individualShareOfPool = individualStakedBigNumber.mul(ethers.constants.WeiPerEther).div(totalStakedBigNumber);
                    const individualValueWei = tvlScaled.mul(individualShareOfPool).div(ethers.constants.WeiPerEther);
                    const pricePerToken = individualValueWei.div(totalSupplyBigNumber);

                    // Scale the result by 100 and format to show 2 decimal places
                    const scaledPrice = pricePerToken.mul(100);  // Scaling the price by 100
                    setVTokenPrice(ethers.utils.formatUnits(scaledPrice, 2));  // Converting to a readable format with 2 decimals
                } else {
                    setVTokenPrice('0');
                }
            } catch (error) {
                console.error('Error in vTokenPrice calculation:', error);
                setVTokenPrice('Error');
            }
        } else {
            setVTokenPrice('Calculating...');
        }
    }, [tvl, totalSupply, totalStakedInPool, individualStakedAmount]);

    return vTokenPrice;
};

export default useVTokenPrice;
