// file: asx/earn/src/components/PoolCard.tsx
// IMPORTS
import React, { useEffect, useState } from 'react';
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
import useTokenPrices from '../hooks/useTokenPrices';
import { useTotalSupply } from '../hooks/useTotalSupply';
import { useRewardData } from '../hooks/useRewardData';
import useLPReserves from '../hooks/useLPReserves';
import StakeButton from '../hooks/StakeButton'
import WithdrawButton from '../hooks/WithdrawButton';
import GetRewardButton from '../hooks/GetRewardButton';

// INTERFACE/S





interface PoolCardProps {
  pool: PoolConfig;
  accountAddress: string;
  onStakedUSDChange: (amount: number) => void;
  onClaimableRewardsUSDChange: (amount: number) => void;
  id?: number;
}





/// MAIN FUNCTION ///////////////////






const PoolCard: React.FC<PoolCardProps> = ({ pool, accountAddress, onStakedUSDChange, onClaimableRewardsUSDChange }) => {
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
  const platformId = 'binance-smart-chain';
  const prices = useTokenPrices(platformId, [...contractAddresses, ASXTokenAddress]);
  const { reserve0, reserve1 } = useLPReserves(pool.stakingToken.address);
  const totalSupply = useTotalSupply(pool.stakingToken.address);
  const { rewardData } = useRewardData(pool.stakingContract.address, pool.rewardToken.address);




  /// LP PRICE CALC ///////////////////




  const calculateLPPrice = () => {
    if (pool.type !== 'lp' || !pool.stakingToken.constituents || !totalSupply?.data) {
      return prices[ASXTokenAddress]?.toFixed(2) || 'Loading...';
    }
    const token1Price = prices[pool.stakingToken.constituents.token1.address] || 0;
    const token2Price = prices[pool.stakingToken.constituents.token2.address] || 0;
    const totalReserveUSD =
      Number(formatUnits(reserve1, 18)) * token1Price +
      Number(formatUnits(reserve0, 18)) * token2Price;
    const totalSupplyUnits = Number(formatUnits(totalSupply.data, 18));
    const lpTokenPriceUSD = totalReserveUSD / totalSupplyUnits;
    return lpTokenPriceUSD.toFixed(2); 
  };
  const lpTokenPriceDisplay = calculateLPPrice();
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

  const lpTokenPriceUSD = calculateLPPrice(); 
  const totalStakedInUSD = stakedAmount ? parseFloat(formatUnits(stakedAmount, 18)) * parseFloat(lpTokenPriceUSD) : 0;
  const formattedTotalStakedInUSD = totalStakedInUSD.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  

  const formatNumber = (value: number | bigint) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value);

    const displayFormattedAmount = (amountInWei: BigNumberish | null, tokenAddress: string, symbol: string) => {
      if (amountInWei === null) return <span>Loading...</span>;
      const amountInEther = parseFloat(formatUnits(amountInWei, 18));
      let price = prices[tokenAddress] || 0;
      const amountInUSD = amountInEther * price;
    
      return (
        <>
          <span className={styles.numberValue}>{formatNumber(amountInEther)}</span>
          {' '}
          <span>{symbol}</span>
          {' ('}
          <span className={styles.usdValue}>{formatNumber(amountInUSD)} USD</span>
          {')'}
        </>
      );
    };



/// REWARD DATA CALC APR  ///////////////////


const [apr, setApr] = useState<number | null>(null);
const [aprStatus, setAprStatus] = useState<string>('Calculating...'); 

  useEffect(() => {
    if (rewardData && totalSupply.data && prices[pool.stakingToken.address] && prices[pool.rewardToken.address]) {
      try {
        const rewardTokenPriceInWei = ethers.utils.parseUnits(prices[pool.rewardToken.address].toString(), 'ether');
        const stakingTokenPriceInWei = ethers.utils.parseUnits(prices[pool.stakingToken.address].toString(), 'ether');
        const totalRewardsPerYear = rewardData.rewardRate.mul(SECONDS_IN_A_YEAR);
        const totalRewardsPerYearInUSD = totalRewardsPerYear.mul(rewardTokenPriceInWei);
        const totalStakedInWei = BigNumber.from(totalSupply.data.toString());
        const totalTVLInUSD = totalStakedInWei.mul(stakingTokenPriceInWei);
        let aprValue = BigNumber.from(0);
        if (!totalTVLInUSD.isZero() && !totalRewardsPerYearInUSD.isZero()) {
          aprValue = totalRewardsPerYearInUSD.mul(ethers.utils.parseUnits('100', 'ether')).div(totalTVLInUSD);
        }
        const aprPercentage = ethers.utils.formatUnits(aprValue, 'ether');
        setApr(parseFloat(aprPercentage));
        setAprStatus(`${parseFloat(aprPercentage).toFixed(2)}%`);
      } catch (error) {
        console.error("Error calculating APR:", error);
        setAprStatus('Error');
      }
    } else {
      setAprStatus('Calculating...');
    }
  }, [rewardData, totalSupply.data, prices, pool.stakingToken.address, pool.rewardToken.address, SECONDS_IN_A_YEAR]);
  


  const calculateTVL = () => {
    const tokenPrice = prices[pool.stakingToken.address] || 0; // Get the current price of the staking token
    console.log(tokenPrice);
    const stakedAmountInEther = stakedAmount ? parseFloat(formatUnits(stakedAmount, 18)) : 0;
    const tvlInUSD = stakedAmountInEther * tokenPrice;
    return tvlInUSD.toFixed(2); // Convert to a string with 2 decimal places
    
   
  };

  const tvlDisplay = calculateTVL();


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
  // Convert stakedAmount from BigNumber to a string in ethers format
  const stakedAmountInEthers = stakedAmount ? ethers.utils.formatUnits(stakedAmount, 18) : '0';
  
  // Set the amount for withdrawal based on input; if input is empty, use the total staked amount
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




/// FORMATTING ///////////////////






    

/// FRONTEND/RENDER ///////////////////


  return (
    <div className={styles.poolCard}>
      <div className={styles.cardHeader}>
      <div className={styles.titleAndLogoContainer}>
  <div className={styles.titleAndLogo}>
    <h1 className={styles.poolTitle}>{pool.title}</h1>
    <a href={pool.stakingToken.buyLink} target="_blank" rel="noopener noreferrer" className={styles.buyLink}>
      <Image src="/logos/PancakeSwap Logos/Full Logo/bunny-color.svg" alt="PancakeSwap Logo" width={20} height={30}/>
    </a>
  </div>
  <div className={styles.tvl}>TVL: <strong>${tvlDisplay} USD</strong></div>
</div>
        <div className={styles.logoContainer}>
          <Image src={imageSrc} alt="Token Logo" width={40} height={40} priority onError={handleImageError} />
        </div>
        <div className={styles.aprAndPrice}>
          <div className={styles.apr}> 
        <div>{aprStatus} APR</div> 
        </div>
          <div>{pool.title} Price: $ {lpTokenPriceDisplay}</div> 
        </div>
      </div>
      <div className={styles.cardBody}>
      <div className={styles.poolInfo}>
  <span>{pool.title} in Wallet:</span>
  <span>{displayFormattedAmount(tokenBalance, pool.stakingToken.address, pool.stakingToken.symbol)}</span>
</div>
<div className={styles.poolInfo}>
  <span>Staked:</span>
  <span>{displayFormattedAmount(stakedAmount, pool.stakingToken.address, pool.stakingToken.symbol)}</span>
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
        accountAddress={accountAddress}
        amount={handleWithdraw()}
        onUpdate={handleStakeUpdate}
      />
          
<GetRewardButton
  stakingContractAddress={pool.stakingContract.address}
  accountAddress={accountAddress}
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
