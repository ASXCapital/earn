// src/config/chainConfig.ts

export const chainRpcUrls: { [chainId: number]: string } = {
    56: process.env.NEXT_PUBLIC_BSC_RPC_1 || "https://bsc-dataseed.binance.org/",
    1116: process.env.NEXT_PUBLIC_CORE_RPC_1 || "https://rpc.ankr.com/core",
    // Add other chains if needed
};
