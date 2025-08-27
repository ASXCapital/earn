export interface CollectionConfig {
    address: string;
    symbol?: string;
    name?: string;
    standard: 'ERC721' | 'ERC1155';
    description?: string;
}

export interface TokenSupplyStats {
    totalSupply?: number;
    totalOwners?: number;
    maxTokenIdScanned: number;
    ownerSample: number;
    uniqueOwnerAddresses: number;
}

export interface FloorInfo {
    floorPrice?: number; // in native token
    floorTokenId?: string;
}

export interface CollectionOnChainMeta {
    name?: string;
    symbol?: string;
}
