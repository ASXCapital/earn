import { SupportedChainKey } from '@/types/staking';

// Maps a token symbol (possibly wrapped variant) to a price field in /api/prices output
export function priceForSymbol(symRaw: string, prices: any, chainKey: SupportedChainKey): number | null {
    if (!prices || !symRaw) return null;
    const s = symRaw.toUpperCase();
    if (s === 'ASX') return chainKey === 'core' ? prices.asxCore : prices.asxBsc;
    if (s === 'BNB' || s === 'WBNB') return prices.bnb;
    if (s === 'ETH' || s === 'WETH') return prices.eth;
    if (s === 'BTC' || s === 'WBTC' || s === 'BTCB') return prices.btcb;
    if (s === 'SOL' || s === 'WSOL') return prices.sol;
    return null;
}

export function formatCompactNumber(n: number): string {
    if (!Number.isFinite(n)) return '0';
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
    if (n === 0) return '0';
    return n.toLocaleString();
}
