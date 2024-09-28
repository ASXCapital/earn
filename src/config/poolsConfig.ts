// asx/src/config/poolsConfig.ts

import { contracts } from "./contracts";
import { ASXStakingABI } from "../abis/ASXStakingABI";
import { PancakeV2LPABI } from "../abis/PancakeV2LPABI";
import { ASXABI } from "../abis/ASXABI";
import { ETHABI } from "../abis/ETHABI";
import { BNBABI } from "../abis/BNBABI";
import { BTCBABI } from "../abis/BTCBABI";
import { erc20Abi } from "viem";
import { ERC20ABI } from "../abis/ERC20ABI";

const ASX = contracts.bscTokens.ASX;
const BNB = contracts.bscTokens.WBNB;
const ETH = contracts.bscTokens.ETH;
const BTCB = contracts.bscTokens.BTCB;
const SOL = contracts.bscTokens.SOL;
const CAT = contracts.bscTokens.CAT;

type PoolType = "single" | "lp";

export interface ConstituentToken {
  address: string;
  symbol: string;
  abi: any;
}

export interface StakingToken {
  image: any;
  address: string;
  symbol: string;
  abi: any;
  buyLink: string;
  constituents?: {
    token1: ConstituentToken;
    token2: ConstituentToken;
  };
}

export interface PoolConfig {
  id: string;
  title: string;
  type: PoolType;
  chainId: number;
  stakingToken: StakingToken;
  rewardToken: {
    address: string;
    symbol: string;
    abi: any;
  };
  stakingContract: {
    address: string;
    abi: any;
  };
}

export const poolsConfig: PoolConfig[] = [
  {
    id: "asxasx",
    title: "ASX",
    type: "single",
    chainId: 56,
    stakingToken: {
      address: contracts.bscTokens.ASX,
      symbol: "ASX",
      abi: ASXABI,
      buyLink:
        "https://pancakeswap.finance/swap?outputCurrency=0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B",
      image: "/logo.png",
    },
    rewardToken: {
      address: ASX,
      symbol: "ASX",
      abi: ASXABI,
    },
    stakingContract: {
      address: contracts.bscStaking.ASXASXContract,
      abi: ASXStakingABI,
    },
  },
  {
    id: "asxcat",
    title: "ASX-CAT LP",
    type: "lp", // Indicate this is an LP token pool
    chainId: 56,
    stakingToken: {
      address: contracts.bscLPs.ASXCATLP,
      symbol: "ASX-CAT LP",
      abi: PancakeV2LPABI,
      buyLink:
        "https://pancakeswap.finance/add/0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B/0x6894CDe390a3f51155ea41Ed24a33A4827d3063D",
      image: "/logos/simonscat.png",
      constituents: {
        // Specify the constituent tokens for the LP token
        token1: {
          address: ASX,
          symbol: "ASX",
          abi: ASXABI,
        },
        token2: {
          address: CAT,
          symbol: "CAT",
          abi: ERC20ABI,
        },
      },
    },
    rewardToken: {
      address: ASX,
      symbol: "ASX",
      abi: ASXABI,
    },
    stakingContract: {
      address: contracts.bscStaking.ASXCATContract,
      abi: ASXStakingABI,
    },
  },
  {
    id: "asxsol",
    title: "ASX-SOL LP",
    type: "lp",
    chainId: 56,
    stakingToken: {
      address: contracts.bscLPs.ASXSOLLP,
      symbol: "ASX-SOL LP",
      abi: PancakeV2LPABI,
      buyLink:
        "https://pancakeswap.finance/v2/add/0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B/0x570A5D26f7765Ecb712C0924E4De545B89fD43dF",
      image: "/logos/Solana_logo.png",
      constituents: {
        token1: {
          address: ASX,
          symbol: "ASX",
          abi: ASXABI,
        },
        token2: {
          address: SOL,
          symbol: "SOL",
          abi: erc20Abi,
        },
      },
    },
    rewardToken: {
      address: ASX,
      symbol: "ASX",
      abi: ASXABI,
    },
    stakingContract: {
      address: contracts.bscStaking.ASXSOLContract,
      abi: ASXStakingABI,
    },
  },
  {
    id: "asxbnb",
    title: "ASX-BNB LP",
    type: "lp", // Indicate this is an LP token pool
    chainId: 56,
    stakingToken: {
      address: contracts.bscLPs.ASXBNBLP,
      symbol: "ASX-BNB LP",
      abi: PancakeV2LPABI,
      buyLink:
        "https://pancakeswap.finance/v2/add/0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B/BNB",
      image: "/logos/bnb-bnb-logo.svg",
      constituents: {
        // Specify the constituent tokens for the LP token
        token1: {
          address: ASX,
          symbol: "ASX",
          abi: ASXABI,
        },
        token2: {
          address: BNB,
          symbol: "BNB",
          abi: BNBABI,
        },
      },
    },
    rewardToken: {
      address: ASX,
      symbol: "ASX",
      abi: ASXABI,
    },
    stakingContract: {
      address: contracts.bscStaking.ASXBNBContract,
      abi: ASXStakingABI,
    },
  },
  {
    id: "asxeth",
    title: "ASX-ETH LP",
    type: "lp",
    chainId: 56,
    stakingToken: {
      address: contracts.bscLPs.ASXETHLP,
      symbol: "ASX-ETH LP",
      abi: PancakeV2LPABI,
      buyLink:
        "https://pancakeswap.finance/v2/add/0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B/0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
      image: "/logos/ethereum-eth-logo.svg",
      constituents: {
        token1: {
          address: ASX,
          symbol: "ASX",
          abi: ASXABI,
        },
        token2: {
          address: ETH,
          symbol: "ETH",
          abi: ETHABI,
        },
      },
    },
    rewardToken: {
      address: ASX,
      symbol: "ASX",
      abi: ASXABI,
    },
    stakingContract: {
      address: contracts.bscStaking.ASXETHContract,
      abi: ASXStakingABI,
    },
  },
  {
    id: "asxbtcb",
    title: "ASX-BTCB LP",
    type: "lp",
    chainId: 56,
    stakingToken: {
      address: contracts.bscLPs.ASXBTCBLP,
      symbol: "ASX-BTCB LP",
      abi: PancakeV2LPABI,
      buyLink:
        "https://pancakeswap.finance/v2/add/0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B/0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
      image: "/logos/bitcoin-btc-logo.svg",
      constituents: {
        token1: {
          address: ASX,
          symbol: "ASX",
          abi: ASXABI,
        },
        token2: {
          address: BTCB,
          symbol: "BTCB",
          abi: BTCBABI,
        },
      },
    },
    rewardToken: {
      address: ASX,
      symbol: "ASX",
      abi: ASXABI,
    },
    stakingContract: {
      address: contracts.bscStaking.ASXBTCBContract,
      abi: ASXStakingABI,
    },
  },
];

export default poolsConfig;