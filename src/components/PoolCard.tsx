// file: asx/earn/src/components/PoolCard.tsx
// IMPORTS
import React, { useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import Image from 'next/image';
import { BigNumberish, BigNumber} from 'ethers';
import styles from '../styles/StakingPage.module.css';
import { PoolConfig } from '../config/poolsConfig';
import { contracts } from '../config/contracts';
import { useStakedAmount } from '../hooks/useStakedAmount';
import { useClaimableRewards } from '../hooks/useClaimableRewards';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { useTotalSupply } from '../hooks/useTotalSupply';
import { useRewardData } from '../hooks/useRewardData';
import useLPReserves from '../hooks/useLPReserves';
import StakeButton from '../hooks/StakeButton'
import WithdrawButton from '../hooks/WithdrawButton';
import GetRewardButton from '../hooks/GetRewardButton';
import { useTokenPricesContext } from '../contexts/TokenPricesContext';
import { useMemo } from 'react';
import { useTotalStaked } from '../hooks/useTotalStaked';






// INTERFACE/S





interface PoolCardProps {
  pool: PoolConfig;
  accountAddress: string;
  onStakedUSDChange: (amount: number) => void;
  onClaimableRewardsUSDChange: (amount: number) => void;
  onTVLChange: (poolId: string | number, tvl: number) => void;
  poolId: string | number; // This might already be included as part of `pool`
}





/// MAIN FUNCTION ///////////////////






const PoolCard: React.FC<PoolCardProps> = ({ pool, accountAddress, onTVLChange, }) => {
  const prices = useTokenPricesContext();

  const { totalStaked, isLoading: isTotalStakedLoading } = useTotalStaked(pool.stakingContract.address);


  const ASXTokenAddress = contracts.bscTokens.ASX;
  const [stakeAmount, setStakeAmount] = useState<string>('0.01');
  const [inputContent, setInputContent] = useState<string>('0.01'); // New state for tracking input field content
  const [imageSrc, setImageSrc] = useState(pool.stakingToken.image || '/default_image.png');
  const handleImageError = () => {
    setImageSrc('/default_image.png');
  };
  const SECONDS_IN_A_YEAR = 365 * 24 * 60 * 60;
  const [stakedAmount, setStakedAmount] = useState<bigint | null>(null);
  const [claimableRewards, setClaimableRewards] = useState<bigint | null>(null);
  const [tokenBalance, setTokenBalance] = useState<bigint | null>(null);
  const stakedAmountResult = useStakedAmount(pool.stakingContract.address, accountAddress);
  const claimableRewardsResult = useClaimableRewards(pool.stakingContract.address, accountAddress);
  const tokenBalanceResult = useTokenBalance(pool.stakingToken.address, accountAddress);
  let contractAddresses = [pool.stakingToken.address];
  if (pool.type === 'lp' && pool.stakingToken.constituents) {
    contractAddresses = [
      pool.stakingToken.constituents.token1.address,
      pool.stakingToken.constituents.token2.address,
    ];
  }
  
  const { reserve0, reserve1 } = useLPReserves(pool.stakingToken.address);
  const totalSupply = useTotalSupply(pool.stakingToken.address);
  const { rewardData } = useRewardData(pool.stakingContract.address, pool.rewardToken.address);




  /// LP PRICE CALC ///////////////////



  const calculateLPPrice = () => {
    // Only proceed if it's an LP pool with all necessary data available
    if (pool.type !== 'lp' || !pool.stakingToken.constituents || !totalSupply?.data || reserve0 === undefined || reserve1 === undefined) {
      return '0'; // Return '0' for invalid or incomplete data sets
    }
  
    const { token1, token2 } = pool.stakingToken.constituents;


const token2Price = prices[token1.address.trim().toLowerCase()];
const token1Price = prices[token2.address.trim().toLowerCase()];

    
  
    // Log the token addresses and their corresponding prices
  
    const totalReserveUSD = (Number(formatUnits(reserve0, 18)) * token1Price) + (Number(formatUnits(reserve1, 18)) * token2Price);
    const totalSupplyUnits = Number(formatUnits(totalSupply.data, 18));
    const lpTokenPriceUSD = totalSupplyUnits > 0 ? totalReserveUSD / totalSupplyUnits : 0;
  
    return lpTokenPriceUSD.toFixed(2);
  };
  
  
  // Use useMemo to avoid recalculating LP price on every render
  const lpTokenPriceUSD = useMemo(calculateLPPrice, [pool, prices, totalSupply?.data, reserve0, reserve1]);
  
  useEffect(() => {
    if (stakedAmountResult.data !== undefined) {
      setStakedAmount(stakedAmountResult.data);
    }
    if (claimableRewardsResult.data) {
      const totalRewards = claimableRewardsResult.data.reduce((acc, curr) => acc + curr.amount, BigInt(0));
      setClaimableRewards(totalRewards);
    }
    if (tokenBalanceResult.data !== undefined) {
      setTokenBalance(tokenBalanceResult.data);
    }
  }, [stakedAmountResult, claimableRewardsResult, tokenBalanceResult]);
  
  

  const formatNumber = (value: number | bigint) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value);

const displayFormattedAmount = (amountInWei: BigNumberish | null, tokenAddress: string, symbol: string, useLpTokenPrice = false) => {
  if (amountInWei === null) return <span>Loading...</span>;
  const amountInEther = parseFloat(formatUnits(amountInWei, 18));
  let price = useLpTokenPrice ? parseFloat(lpTokenPriceUSD) : prices[tokenAddress] || 0;
  
  const amountInUSD = amountInEther * price;

  return (
    <>
      <span className={styles.numberValue}>{formatNumber(amountInEther)}</span>
      {' '}
      <span>{symbol}</span>
      {' ('}
      <span className={styles.usdValue}>{`$${formatNumber(amountInUSD)}`}</span>
      {')'}
    </>
  );
};

    
    



/// REWARD DATA CALC APR  ///////////////////

const [apr, setApr] = useState<number | null>(null);
const [aprStatus, setAprStatus] = useState<string>('Calculating...');





// APR calculation
useEffect(() => {
  if (!isTotalStakedLoading && totalStaked && rewardData?.rewardRate && prices[pool.rewardToken.address]) {
    try {
      const stakingTokenPriceUSD = pool.type === 'lp' ? parseFloat(lpTokenPriceUSD) : prices[pool.stakingToken.address.toLowerCase()] || 0;
      const rewardTokenPriceUSD = prices[pool.rewardToken.address.toLowerCase()] || 0;
      const totalRewardsPerYearTokens = parseFloat(formatUnits(rewardData.rewardRate, 18)) * SECONDS_IN_A_YEAR;
      const totalRewardsPerYearInUSD = totalRewardsPerYearTokens * rewardTokenPriceUSD;

      const totalStakedTokens = parseFloat(formatUnits(totalStaked, 18));
      const totalTVLInUSD = totalStakedTokens * stakingTokenPriceUSD;

      const apr = totalTVLInUSD > 0 ? (totalRewardsPerYearInUSD / totalTVLInUSD) * 100 : 0;

      setApr(apr);
      setAprStatus(`${apr.toFixed(2)}%`);
    } catch (error) {
      console.error("Error calculating APR:", error);
      setAprStatus('Error');
    }
  } else {
    setAprStatus('Calculating...');
  }
}, [rewardData, totalStaked, isTotalStakedLoading, prices]);



  

  


/// STAKING UPDATE/REFRESH






  const handleStakeUpdate = () => {
    stakedAmountResult.refetch();
    claimableRewardsResult.refetch();
    tokenBalanceResult.refetch();
  };
  const [inputStatus, setInputStatus] = useState('empty'); 
  useEffect(() => {
    const interval = setInterval(() => {
      handleStakeUpdate();
    }, 500000); // Approximate block time for Ethereum is 15 seconds
    return () => clearInterval(interval);
  }, []);





/// INPUT HANDLING ///////////////////



const handleWithdraw = () => {
  const stakedAmountInEthers = stakedAmount ? ethers.utils.formatUnits(stakedAmount, 18) : '0';
  const withdrawalAmount = stakeAmount === '' ? stakedAmountInEthers : stakeAmount;
  return withdrawalAmount;
};

const handleInputStatusChange = () => {
  setInputStatus(prevStatus => prevStatus === 'wallet' ? 'clear' : 'wallet');
  if (inputStatus === 'clear') {
    setInputContent(''); // Ensure inputContent is cleared when "Clear" is clicked
  }
};

useEffect(() => {
  if (inputStatus === 'wallet') {
    setStakeAmount(tokenBalance ? ethers.utils.formatUnits(tokenBalance, 18) : '');
    setInputContent(tokenBalance ? ethers.utils.formatUnits(tokenBalance, 18) : ''); // Update inputContent when setting max wallet
  } else {
    setStakeAmount('');
    setInputContent(''); // Clear inputContent along with stakeAmount
  }
}, [inputStatus, tokenBalance]);

const handleStakeAmountChange = (e) => {
  const value = e.target.value;
  const regex = /^\d*\.?\d{0,18}$/;

  if (value === '' || regex.test(value)) {
    setStakeAmount(value);
    setInputContent(value); // Update inputContent based on the current input field content
  }
};




/// TVL ///////////////////




// Inside your component
const totalSupplyResult = useTotalSupply(pool.stakingContract.address);

// Inside your component
const calculateTVLinUSD = () => {
  
  if (!totalSupplyResult.data) return 'Loading...';

  // Total staked tokens
  const totalStakedTokens = parseFloat(formatUnits(totalSupplyResult.data, 18));
  let totalStakedInUSD = 0;

  if (pool.type === 'lp') {
    // For LP tokens, use the LP token price calculated from reserves
    const lpTokenPriceUSD = parseFloat(calculateLPPrice());
    totalStakedInUSD = totalStakedTokens * lpTokenPriceUSD;
  } else {
    // For single tokens, directly use the token price from the prices object
    const tokenPriceUSD = prices[pool.stakingToken.address] || 0;
    totalStakedInUSD = totalStakedTokens * tokenPriceUSD;
  }

  return formatNumber(totalStakedInUSD);
};

const tvlInUSD = calculateTVLinUSD();
const lastReportedTVL = useRef<number>();


useEffect(() => {
  const currentTVLString = calculateTVLinUSD().replace(/,/g, '');
  
 // This might be a string
 const currentTVL = parseFloat(currentTVLString);
 
  
  if (!isNaN(currentTVL) && currentTVLString !== "Loading..." && currentTVL !== lastReportedTVL.current) {
    onTVLChange(pool.id, currentTVL);
    lastReportedTVL.current = currentTVL; // Update the ref's current value
    
  }
}, [pool.id, onTVLChange, calculateTVLinUSD]);


    

/// FRONTEND/RENDER ///////////////////


  return (
    <div className={styles.poolCard}>
      <div className={styles.cardHeader}>
      <div className={styles.titleAndLogoContainer}>
  <div className={styles.titleAndLogo}>
    <h1 className={styles.poolTitle}>{pool.title}</h1>
    <a href={pool.stakingToken.buyLink} target="_blank" rel="noopener noreferrer" className={styles.buyLink}>
      <Image src="/logos/PancakeSwap Logos/Full Logo/color-white.svg" alt="PancakeSwap Logo" width={80} height={30}/>
    </a>
  </div>
  <div className={styles.tvl}>TVL: <strong>${tvlInUSD}</strong></div>
</div>

        <div className={styles.logoContainer}>
          <Image src={imageSrc} alt="Token Logo" width={40} height={40} priority onError={handleImageError} />
        </div>
        <div className={styles.aprAndPrice}>
          <div className={styles.apr}> 
        <div>{aprStatus} APR</div> 
        </div>
        <div>
  {pool.title} Price: $ 
  {pool.type === 'lp' ? lpTokenPriceUSD : prices[ASXTokenAddress.toLowerCase()] || 'Loading...'}
</div>

        </div>
      </div>
      <div className={styles.cardBody}>
  <div className={styles.poolInfo}>
    <span>{pool.title} in Wallet:</span>
    {/* Use displayFormattedAmount for wallet balance, passing true for useLpTokenPrice if it's an LP token */}
    <span>{displayFormattedAmount(tokenBalance, pool.stakingToken.address, pool.stakingToken.symbol, pool.type === 'lp')}</span>
  </div>
  <div className={styles.poolInfo}>
    <span>Staked:</span>
    {/* Use displayFormattedAmount for staked amount, also passing true for useLpTokenPrice if it's an LP token */}
    <span>{displayFormattedAmount(stakedAmount, pool.stakingToken.address, pool.stakingToken.symbol, pool.type === 'lp')}</span>
  </div>
  <div className={styles.poolInfo}>
    <span>Claimable Rewards:</span>
    <span>{displayFormattedAmount(claimableRewards, ASXTokenAddress, '$ASX')}</span>
  </div>



        </div>
        <div className={styles.actionSection}>
      <button className={styles.actionButtonMAX} onClick={handleInputStatusChange}>
        {inputContent === '' ? 'Max.' : 'Clear'}
      </button>
      <input
        className={styles.stakeInput}
        type="text"
        value={stakeAmount}
        onChange={handleStakeAmountChange}
        placeholder="Token Amount"
      />

      <StakeButton
        tokenAddress={pool.stakingToken.address}
        stakingContractAddress={pool.stakingContract.address}
        accountAddress={accountAddress}
        amount={stakeAmount}
        onUpdate={handleStakeUpdate}
      />

      {/* Use the handleWithdraw function to conditionally set the withdrawal amount */}
      <WithdrawButton
        stakingContractAddress={pool.stakingContract.address}
      
        amount={handleWithdraw()}
        onUpdate={handleStakeUpdate}
      />
          
<GetRewardButton
  stakingContractAddress={pool.stakingContract.address}
 
  onUpdate={handleStakeUpdate} // Re-use the stake update function or create a specific one for rewards
/>

          
        </div>
        <div className={styles.cardFooter}>
  Contract Address (
  <a
    href={`https://bscscan.com/address/${pool.stakingContract.address}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    {`${pool.stakingContract.address.slice(0, 6)}...${pool.stakingContract.address.slice(-4)}`}
  </a>
  )
</div>
    </div>
  );
};
export default PoolCard;
