import { z } from "zod";

export const env = z
  .object({
    COINGECKO_API_KEY: z.string().min(1),
    RPC_BSC_HTTP: z.string().min(1).optional(),
    RPC_BSC_QNODE_HTTP: z.string().min(1).optional(),
    CORE_RPC_1: z.string().min(1).optional(),
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID: z.string().optional(),
    THIRDWEB_SECRET_KEY: z.string().optional(),
    THIRDWEB_PROJECT_ID: z.string().optional(),
    AUTH_JWT_SECRET: z.string().optional(),
    NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS: z.string().optional(),
    NEXT_PUBLIC_MARKETPLACE_CHAIN_ID: z.string().optional(),
    NEXT_PUBLIC_MARKETPLACE_PLATFORM_FEE_BPS: z.string().optional(),
    NEXT_PUBLIC_MARKETPLACE_PLATFORM_FEE_RECIPIENT: z.string().optional(),
  })
  .parse({
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
    RPC_BSC_HTTP: process.env.RPC_BSC_HTTP,
    RPC_BSC_QNODE_HTTP: process.env.RPC_BSC_QNODE_HTTP,
    CORE_RPC_1: process.env.CORE_RPC_1,
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
    THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY,
    THIRDWEB_PROJECT_ID: process.env.THIRDWEB_PROJECT_ID,
    AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET,
    NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS,
    NEXT_PUBLIC_MARKETPLACE_CHAIN_ID: process.env.NEXT_PUBLIC_MARKETPLACE_CHAIN_ID,
    NEXT_PUBLIC_MARKETPLACE_PLATFORM_FEE_BPS: process.env.NEXT_PUBLIC_MARKETPLACE_PLATFORM_FEE_BPS,
    NEXT_PUBLIC_MARKETPLACE_PLATFORM_FEE_RECIPIENT: process.env.NEXT_PUBLIC_MARKETPLACE_PLATFORM_FEE_RECIPIENT,
  });
