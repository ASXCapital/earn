// asx/src/config/poolsConfig.ts



import { contracts } from './contracts';
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
  buyLink: string;
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
      buyLink: 'https://pancakeswap.finance/swap?outputCurrency=0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B',
      image: '/asxx5.png'
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
      buyLink: 'https://pancakeswap.finance/add/0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B/BNB',
      image: '/logos/bnb-bnb-logo.svg',
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
      buyLink:'https://pancakeswap.finance/add/0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B/0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      image: '/logos/ethereum-eth-logo.svg',
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
      buyLink:'https://pancakeswap.finance/add/0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B/0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
      image: '/logos/bitcoin-btc-logo.svg',
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
