# ASX Earn

ASX Earn is a Next.js 14 dApp for the ASX ecosystem. It includes staking on BNB Chain and Core, NFT/RWA launchpad and investor dashboards, a thirdweb Marketplace V3 experience, ecosystem contract views, and an updates feed.

## App sections
- Overview: market stats (CoinGecko Pro) plus quick-add wallet actions for BNB/Core networks and ASX tokens.
- NFT/RWA: launchpad table, legal bundles, and investor dashboards for live collections.
- Staking: multi-chain pools with on-chain reads, APR/TVL derived from price feeds, and stake/unstake/claim flows.
- Marketplace: Marketplace V3 UI (listings, offers, activity, admin panel). Can be toggled to a Coming Soon state.
- Ecosystem: contract directory, LPs, staking pools, and a price/updates switcher.
- Updates: RSS feed (Paragraph) with pagination.
- Docs: static legal and terms PDFs in `public/docs` and `public/legal`.

## Tech stack
- Next.js 14 (App Router) + React 18
- Tailwind CSS
- thirdweb SDK (wallet connect + Marketplace V3)
- CoinGecko Pro API (prices, metadata)
- Zod (env validation)

## Key directories
- `app/` - App Router pages, API routes, layout, and globals
- `components/` - UI and feature modules (staking, marketplace, NFT/RWA, ecosystem)
- `data/` - static datasets (staking pools, tokens, watched coins)
- `lib/` - chain config, pricing, safe fetch, RSS parsing
- `marketplace/` - Marketplace V3 config + deployment JSONs
- `subgraph/` - Graph subgraph for marketplace events (testnet)
- `nft-examples/` - sample NFT metadata and assets
- `public/` - images, docs, legal packages

## API routes
- `GET /api/prices` - ASX and major token prices (CoinGecko Pro)
- `GET /api/coins` - watched coin metadata for market cards
- `GET /api/marketplace-feed` - Marketplace listings/offers/activity feed (no cache)

## Local development
```bash
npm install
npm run dev
```

## Scripts
- `npm run dev` - Next dev server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - Next lint
- `npm run format` - Prettier
- `npm run verify:supply` - supply-chain guard
- `npm run deploy:marketplace` - deploy Marketplace V3 (scripted)

## Environment variables
Create `.env.local` as needed:
```
# Required for live prices
COINGECKO_API_KEY=...

# Wallet connect (client-side)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=...

# Server-side thirdweb calls (marketplace feed, insight)
THIRDWEB_SECRET_KEY=...

# Optional RPC overrides
RPC_BSC_HTTP=...
CORE_RPC_1=...

# Marketplace config
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=...
NEXT_PUBLIC_MARKETPLACE_CHAIN_ID=56
NEXT_PUBLIC_MARKETPLACE_PLATFORM_FEE_BPS=100
NEXT_PUBLIC_MARKETPLACE_PLATFORM_FEE_RECIPIENT=...
NEXT_PUBLIC_MARKETPLACE_LISTING_CURRENCY=...
NEXT_PUBLIC_WHITELISTED_COLLECTIONS=0x...,0x...

# Optional: show marketplace as live when set to "false"
NEXT_PUBLIC_MARKETPLACE_COMING_SOON=false
```

## Notes
- Staking pools live in `data/staking.ts`.
- Chain config lives in `lib/thirdweb.ts`.
- Marketplace defaults to testnet unless `NEXT_PUBLIC_MARKETPLACE_CHAIN_ID` is set to mainnet (56).
- The RWA DeFi page is currently a Coming Soon screen.
