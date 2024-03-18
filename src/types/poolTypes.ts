// src/types/poolTypes.ts
export interface ConstituentToken {
    address: string;
    symbol: string;
    abi: any; // Consider using a more specific type for ABI if available
  }
  
  export interface StakingToken {
    address: string;
    symbol: string;
    abi: any;
    constituents?: ConstituentToken[];
  }
  
  export interface PoolConfig {
    id: string;
    title: string;
    type: 'single' | 'lp';
    stakingToken: StakingToken;
    rewardToken: ConstituentToken;
    stakingContract: {
      address: string;
      abi: any;
    };
  }
  