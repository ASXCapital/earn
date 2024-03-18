// asx/src/config/poolsConfig.ts

import { contracts } from '../components/config/contracts';
import { ASXStakingABI } from '../abis/ASXStakingABI';
import { PancakeV2LPABI } from '../abis/PancakeV2LPABI';
import { ASXABI } from '../abis/ASXABI';
import { ETHABI } from '../abis/ETHABI';
import { BNBABI } from '../abis/BNBABI';
import { BTCBABI } from '../abis/BTCBABI';


const ASX = contracts.bscTokens.ASX;
const BNB = contracts.bscTokens.WBNB;
const ETH = contracts.bscTokens.ETH;
const BTCB = contracts.bscTokens.BTCB;

type PoolType = 'single' | 'lp';

export interface ConstituentToken {
  address: string;
  symbol: string;
  abi: any; // Replace 'any' with your ABI type if available
}

export interface StakingToken {
  image: any;
  address: string;
  symbol: string;
  abi: any; // Replace 'any' with your ABI type if available
  constituents?: {
    token1: ConstituentToken;
    token2: ConstituentToken;
  };
}

// Export the PoolConfig interface as well
export interface PoolConfig {
  id: string;
  title: string;
  type: PoolType;
  stakingToken: StakingToken;
  rewardToken: {
    address: string;
    symbol: string;
    abi: any; // Replace 'any' with your ABI type if available
  };
  stakingContract: {
    address: string;
    abi: any; // Replace 'any' with your ABI type if available
  };
}

export const poolsConfig: PoolConfig[] = [

  {
    id: 'asxasx',
    title: 'ASX',
    type: 'single', // Indicate this is a single token pool
    stakingToken: {
      address: contracts.bscTokens.ASX,
      symbol: 'ASX',
      abi: ASXABI,
      image: undefined
    },
    rewardToken: {
      address: ASX,
      symbol: 'ASX',
      abi: ASXABI,
    },
    stakingContract: {
      address: contracts.bscStaking.ASXASXContract,
      abi: ASXStakingABI,
    },
  },
  {
    id: 'asxbnb',
    title: 'ASX-BNB LP',
    type: 'lp', // Indicate this is an LP token pool
    stakingToken: {
      address: contracts.bscLPs.ASXBNBLP,
      symbol: 'ASX-BNB LP',
      abi: PancakeV2LPABI,
      image: undefined,
      constituents: { // Specify the constituent tokens for the LP token
        token1: {
          address: ASX,
          symbol: 'ASX',
          abi: ASXABI,
          
        },
        token2: {
          address: BNB,
          symbol: 'BNB',
          abi: BNBABI
        },
      },
    },
    rewardToken: {
      address: ASX,
      symbol: 'ASX',
      abi: ASXABI,
    },
    stakingContract: {
      address: contracts.bscStaking.ASXBNBContract,
      abi: ASXStakingABI,
    },
  },
  {
    id: 'asxeth',
    title: 'ASX-ETH LP',
    type: 'lp',
    stakingToken: {
      address: contracts.bscLPs.ASXETHLP,
      symbol: 'ASX-ETH LP',
      abi: PancakeV2LPABI,
      image: undefined,
      constituents: {
        token1: {
          address: ASX,
          symbol: 'ASX',
          abi: ASXABI,
        },
        token2: {
          address: ETH,
          symbol: 'ETH',
          abi: ETHABI
        },
      },
    },
    rewardToken: {
      address: ASX,
      symbol: 'ASX',
      abi: ASXABI,
    },
    stakingContract: {
      address: contracts.bscStaking.ASXETHContract,
      abi: ASXStakingABI,
    },
  },
  {
    id: 'asxbtcb',
    title: 'ASX-BTCB LP',
    type: 'lp',
    stakingToken: {
      address: contracts.bscLPs.ASXBTCBLP,
      symbol: 'ASX-BTCB LP',
      abi: PancakeV2LPABI,
      image: undefined,
      constituents: {
        token1: {
          address: ASX,
          symbol: 'ASX',
          abi: ASXABI,
        },
        token2: {
          address: BTCB,
          symbol: 'BTCB',
          abi: BTCBABI
        },
      },
    },
    rewardToken: {
      address: ASX,
      symbol: 'ASX',
      abi: ASXABI,
    },
    stakingContract: {
      address: contracts.bscStaking.ASXBTCBContract,
      abi: ASXStakingABI,
    },
  },
];

export default poolsConfig;
