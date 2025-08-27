export interface PoolRowProps {
    id: string;
    dex?: string;
    baseSymbol: string;
    quoteSymbol: string;
    reserveUSD?: number;
    price?: number;
    derivation?: string;
    network: string;
}
