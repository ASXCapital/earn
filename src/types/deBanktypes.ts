// src/types/deBanktypes.ts
export interface LPToken {
    id: string;
    chain: string;
    name: string;
    symbol: string;
    logo_url: string;
    amount: number;
}

export interface PortfolioItem {
    stats: {
        asset_usd_value: number;
    };
    detail: {
        supply_token_list: LPToken[];
    };
    name: string;
}

export interface Protocol {
    id: string;
    name: string;
    logo_url: string;
    portfolio_item_list: PortfolioItem[];
    stats: {
        net_usd_value: number;
    };
}
