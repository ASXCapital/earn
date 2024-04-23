import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { BigNumber } from 'ethers';
import { erc20Abi } from 'viem';

const ERC20ABI = erc20Abi;

export const useERC20TotalSupply = (contractAddress) => {
    const [totalSupply, setTotalSupply] = useState(BigNumber.from(0));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { data, isError, isLoading } = useReadContract({
        address: contractAddress,
        abi: ERC20ABI,
        functionName: 'totalSupply',
    });

    useEffect(() => {
        if (isError) {
            setError('Failed to fetch total supply');
            setLoading(false);
        } else if (isLoading) {
            setLoading(true);
        } else if (data) {
            setTotalSupply(BigNumber.from(data));
            setLoading(false);
        }
    }, [data, isError, isLoading]);

    return { totalSupply, loading, error };
};
