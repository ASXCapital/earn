// asx/src/config/vaultsConfig.ts


import { contracts } from './contracts';

import { ASXVaultsABINative } from '../abis/ASXVaultsABINative';
import { ASXVaultsABI } from '../abis/ASXVaultsABI';
import { PancakeV2LPABI } from '../abis/PancakeV2LPABI';



import { erc20Abi } from 'viem';

const ERC20ABI = erc20Abi;

const ASX = contracts.bscTokens.ASX;
const wBNB = contracts.bscTokens.WBNB;
const ETH = contracts.bscTokens.ETH;
const BTCB = contracts.bscTokens.BTCB;

const vASX = contracts.bscVaults.vASX;
const vASXwBNB = contracts.bscVaults.vASXwBNB;
const vASXETH = contracts.bscVaults.vASXETH;
const vASXBTCB = contracts.bscVaults.vASXBTCB;

const ASXBNBLP = contracts.bscLPs.ASXBNBLP;
const ASXETHLP = contracts.bscLPs.ASXETHLP;
const ASXBTCBLP = contracts.bscLPs.ASXBTCBLP;


export interface VaultToken {
  address: string;
  symbol: string;
  abi: any;
  depositToken: {
    address: string;
    symbol: string;
    abi: any;
    max: number;
  };
}

export interface VaultConfig {
  id: string;
  title: string;
  isNativeToken: boolean,
  vaultToken: VaultToken;
  vaultContract: {
    address: string;
    abi: any;
  };
  underlyingLP?: {
    address: string,
    abi: any,
    name: string,
  },
  underlyingAsset?: {
    address: string,
    abi: any,
    name: string,
  }
}

export const vaultsConfig: VaultConfig[] = [
  {
    id: 'asxasx',
    title: 'vASX Vault',
    isNativeToken: true,
    vaultToken: {
      address: vASX,
      symbol: 'vASX',
      abi: ASXVaultsABINative,
      depositToken: {
        address: null, // Using wBNB for the native BNB deposits
        symbol: 'BNB',
        abi: null, // Using the ERC20 ABI for wBNB
        max: 1
      }
    },
    vaultContract: {
      address: vASX,
      abi: ASXVaultsABINative,
    },
    underlyingAsset: {
      name: 'ASX',
      address: ASX,
      abi: ERC20ABI,
    }

  },
  {
    id: 'asxbnb',
    title: 'vASX-wBNB Vault',
    isNativeToken: false,
    vaultToken: {
      address: vASXwBNB,
      symbol: 'vASXwBNB',
      abi: ASXVaultsABI,
      depositToken: {
        address: wBNB,
        symbol: 'WBNB',
        abi: ERC20ABI,
        max: 2
      }
    },
    vaultContract: {
      address: vASXwBNB,
      abi: ASXVaultsABI,
    },
    underlyingLP: {
      name: 'ASX-wBNB LP',
      address: ASXBNBLP,
      abi: PancakeV2LPABI,
    },
  },
  {
    id: 'asxeth',
    title: 'vASX-ETH Vault',
    isNativeToken: false,
    vaultToken: {
      address: vASXETH,
      symbol: 'vASXETH',
      abi: ASXVaultsABI,
      depositToken: {
        address: ETH, // ETH address for deposit token
        symbol: 'ETH',
        abi: ERC20ABI,
        max: 0.2
      }
    },
    vaultContract: {
      address: vASXETH,
      abi: ASXVaultsABI,
    },
    underlyingLP: {
      name: 'ASX-ETH LP',
      address: ASXETHLP,
      abi: PancakeV2LPABI,
    },
  },
  {
    id: 'asxbtcb',
    title: 'vASX-BTCB Vault',
    isNativeToken: false,
    vaultToken: {
      address: vASXBTCB,
      symbol: 'vASXBTCB',
      abi: ASXVaultsABI,
      depositToken: {
        address: BTCB, // BTCB address for deposit token
        symbol: 'BTCB',
        abi: ERC20ABI,
        max: 0.012
      }
    },
    vaultContract: {
      address: vASXBTCB,
      abi: ASXVaultsABI,
    },
    underlyingLP: {
      name: 'ASX-BTCB LP',
      address: ASXBTCBLP,
      abi: PancakeV2LPABI,
    },
  },
];

export default vaultsConfig;