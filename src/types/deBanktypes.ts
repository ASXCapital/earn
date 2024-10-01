// src/types/deBanktypes.ts

export interface Stats {
    asset_usd_value: number;
    net_usd_value: number;
}

export interface Pool {
    id: string;
    chain: string;
    project_id: string;
    adapter_id: string;
    controller: string;
    index: number | null;
    time_at: number;
}

export interface SupplyToken {
    symbol: string;
    amount: number;
    logo_url: string;
    name: string;
}

export interface PortfolioItem {
    isStakedLP: boolean;
    name: string;
    stats: Stats;
    detail?: {
        supply_token_list: SupplyToken[];
    };
    pool?: Pool; // Optional property to represent the pool details
}

export interface Protocol {
    id: string;
    name: string;
    logo_url: string;
    stats?: Stats; // Optional property to include the 'stats' object
    portfolio_item_list: PortfolioItem[];
}
