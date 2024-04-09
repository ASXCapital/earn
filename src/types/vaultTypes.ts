// file: src/types/vaultTypes.ts


export interface VaultCardProps {
    title: string;
    receiveToken: string;
    tvl: string;
    apy: number;
    stakedTokenName: string;
    vaultTokenName: string;
    stakedTokenContract: string;
    vaultTokenContract: string;
    userAddress: string;
    isNativeToken?: boolean;
  }
  