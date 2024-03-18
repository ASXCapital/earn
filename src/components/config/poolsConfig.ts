// asx/src/config/poolsConfig.ts

import { contracts } from './contracts';
import ASXABI from '../abis/ASXABI.json';
import ASXStakingABI from '../abis/ASXStakingABI.json';
import PancakeV2LPABI from '../abis/PancakeV2LPABI.json';




export interface TokenInfo {
  address: string;
  abi: any; // Replace 'any' with a more specific type if available
  isLPToken?: boolean;
  token0Address?: string;
  token1Address?: string;
  token2Address?: string;
}

export interface PoolConfig {
  id: string;
  title: string;
  assetPlatformId: string;
  stakingToken: TokenInfo;
  rewardTokenAddress: string;
  stakingContractAddress: string;
  stakingContractABI: any; // Replace 'any' with a more specific type if available
}

const poolsConfig: PoolConfig[] = [
  {
    id: 'asxasx',
    title: 'ASX-ASX Staking Pool',
    assetPlatformId: 'binance-smart-chain',
    stakingToken: {
      address: contracts.bscTokens.ASX,
      abi: ASXABI,
      isLPToken: false,
      token0Address: contracts.bscTokens.ASX, // Only needed for LP tokens, but included for consistency
    },
    rewardTokenAddress: contracts.bscTokens.ASX,
    stakingContractAddress: contracts.bscStaking.ASXASXContract,
    stakingContractABI: ASXStakingABI,
  },
  {
    id: 'asxbnb',
    title: 'ASX-BNB LP Staking Pool',
    assetPlatformId: 'binance-smart-chain',
    stakingToken: {
      address: contracts.bscLPs.ASXBNBLP,
      abi: PancakeV2LPABI,
      isLPToken: true,
      token0Address: contracts.bscLPs.ASXBNBLP, // LP token address itself
      token1Address: contracts.bscTokens.ASX, // First token in LP pair
      token2Address: contracts.bscTokens.WBNB, // Second token in LP pair
    },
    rewardTokenAddress: contracts.bscTokens.ASX,
    stakingContractAddress: contracts.bscStaking.ASXBNBContract,
    stakingContractABI: ASXStakingABI,
  },
  {
    id: 'asxeth',
    title: 'ASX-ETH LP Staking Pool',
    assetPlatformId: 'binance-smart-chain',
    stakingToken: {
      address: contracts.bscLPs.ASXETHLP,
      abi: PancakeV2LPABI,
      isLPToken: true,
      token0Address: contracts.bscLPs.ASXETHLP,
      token1Address: contracts.bscTokens.ASX,
      token2Address: contracts.bscTokens.ETH,
    },
    rewardTokenAddress: contracts.bscTokens.ASX,
    stakingContractAddress: contracts.bscStaking.ASXETHContract,
    stakingContractABI: ASXStakingABI,
  },
  {
    id: 'asxbtcb',
    title: 'ASX-BTCB LP Staking Pool',
    assetPlatformId: 'binance-smart-chain',
    stakingToken: {
      address: contracts.bscLPs.ASXBTCBLP,
      abi: PancakeV2LPABI,
      isLPToken: true,
      token0Address: contracts.bscLPs.ASXBTCBLP,
      token1Address: contracts.bscTokens.ASX,
      token2Address: contracts.bscTokens.BTCB,
    },
    rewardTokenAddress: contracts.bscTokens.ASX,
    stakingContractAddress: contracts.bscStaking.ASXBTCBContract,
    stakingContractABI: ASXStakingABI,
  },
  // Additional pools can be added here as needed
];

export default poolsConfig;
