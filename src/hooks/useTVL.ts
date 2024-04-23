import { useCallback, useEffect, useState } from "react";
import { useTokenPricesContext } from "../contexts/TokenPricesContext";
import { useTotalStaked } from "./useTotalStaked";
import useLPReserves from "./useLPReserves";
import { useTotalSupply } from "./useTotalSupply";
import poolsConfig from "../config/poolsConfig";

export const useTVL = (poolId) => {
    const [tvl, setTvl] = useState(0); // Default to 0 or some other initial value
    const pool = poolsConfig.find(p => p.id === poolId);
    const prices = useTokenPricesContext();
    const { totalStaked } = useTotalStaked(pool ? pool.stakingContract.address : "");
    const { reserve0, reserve1 } = useLPReserves(pool ? pool.stakingToken.address : "");
    const { data: totalSupply } = useTotalSupply(pool ? pool.stakingToken.address : "");

    const calculateTVL = useCallback(() => {
        if (!totalStaked || !totalSupply) return 0;

        let pricePerToken = 0;
        if (pool?.type === "lp" && reserve0 && reserve1) {
            const token1 = pool.stakingToken.constituents.token1;
            const token2 = pool.stakingToken.constituents.token2;
            const price1 = prices[token1.address.toLowerCase()] ? parseFloat(prices[token1.address.toLowerCase()]) : 0;
            const price2 = prices[token2.address.toLowerCase()] ? parseFloat(prices[token2.address.toLowerCase()]) : 0;
            const totalReserveValue = (Number(reserve1) * price1 + Number(reserve0) * price2);
            pricePerToken = totalReserveValue / parseFloat(totalSupply.toString()); // Convert totalSupply to string
        } else {
            const stakingTokenPrice = prices[pool.stakingToken.address.toLowerCase()] || 0;
            pricePerToken = stakingTokenPrice;
        }

        const totalStakedTokens = parseFloat(totalStaked.toString());
        return totalStakedTokens * pricePerToken;
    }, [totalStaked, totalSupply, reserve0, reserve1, prices, pool]);

    useEffect(() => {
        const newTVL = calculateTVL();
        // Remove 18 decimals
        setTvl(newTVL / 1e18);
    }, [calculateTVL]);

    return tvl;
};

export default useTVL;
