import { useMemo } from 'react';
import useTokenPrices from './useTokenPrices';
import { useTotalStaked } from './useTotalStaked';
import { useTotalSupply } from './useTotalSupply';
import { ethers } from 'ethers';

export const useVTokenPrice = (vaultContractAddress, stakingContractAddress, tokenAddress, platformId) => {
    const { totalStaked: vaultStaked } = useTotalStaked(vaultContractAddress);
    const { totalStaked: totalStakedInStakingContract } = useTotalStaked(stakingContractAddress);
    const { data: totalSupply } = useTotalSupply(vaultContractAddress);
    const prices = useTokenPrices(platformId, [tokenAddress]);

    return useMemo(() => {
        if (!vaultStaked || !totalStakedInStakingContract || !totalSupply || !prices[tokenAddress]) {
            console.error("Missing data for calculation:", {
                vaultStaked,
                totalStakedInStakingContract,
                totalSupply,
                price: prices[tokenAddress]
            });
            return 0; // Ensure all data is present.
        }

        const tokenPrice = prices[tokenAddress];
        const vaultStakedEther = ethers.utils.formatUnits(vaultStaked, 18);
        const totalStakedEther = ethers.utils.formatUnits(totalStakedInStakingContract, 18);
        const totalSupplyEther = ethers.utils.formatUnits(totalSupply, 18);

        const vaultShare = parseFloat(vaultStakedEther) / parseFloat(totalStakedEther);
        const tvl = parseFloat(totalStakedEther) * tokenPrice;
        const vaultTvl = tvl * vaultShare;
        const vTokenPriceUSD = vaultTvl / parseFloat(totalSupplyEther);

        console.log(`VToken Price for vault at ${vaultContractAddress}: $${vTokenPriceUSD.toFixed(2)}`);
        return vTokenPriceUSD;
    }, [vaultStaked, totalStakedInStakingContract, totalSupply, prices, tokenAddress, vaultContractAddress]);
};
