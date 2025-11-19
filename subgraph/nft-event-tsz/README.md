# NFT Event TSZ Subgraph

Indexes the Earn Marketplace V3 contract (`0xfbEe1219180604f9cEF2E9A7C1fCF5392417182f`) on BNB Chain Testnet (Chapel). The subgraph captures every direct listing, auction, bid, offer, sale, and cancellation event emitted by thirdweb’s Marketplace V3 so the UI can read a single, performant GraphQL feed instead of scanning RPC logs.

## Project structure

```
subgraph/nft-event-tsz
├── abis/           // MarketplaceV3 ABI used by the mappings
├── generated/      // created by `graph codegen`
├── schema.graphql  // GraphQL schema defining Listing / Auction / Offer / Activity entities
├── src/mapping.ts  // AssemblyScript handlers for Marketplace V3 events
├── subgraph.yaml   // Data source configuration (network, address, start block…)
└── package.json    // Graph CLI dependencies and scripts
```

## Local workflow

The steps mirror the instructions from the Subgraph Studio screenshot:

1. **Install Graph CLI (once globally)**
   ```bash
   npm install -g @graphprotocol/graph-cli
   ```

2. **Install project dependencies**
   ```bash
   cd subgraph/nft-event-tsz
   npm install
   ```

3. **Generate types & build**
   ```bash
   npm run prepare   # runs graph codegen && graph build
   ```

4. **Authenticate with Studio (replace deploy key)**
   ```bash
   graph auth abd0b2-02651 --product subgraph-studio
   ```

5. **Deploy**
   ```bash
   graph deploy nft-event-tsz
   ```

After deployment you can query the subgraph via Studio (or a self-hosted Graph node) to power the marketplace UI.
