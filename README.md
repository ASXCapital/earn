# ASX DefiLlama Adapter

Adapter to report ASX staking & LP staking TVL on BSC and Core.

## Methodology
- Single-asset staking: Count raw ASX token balance held by each staking contract.
- LP staking: For each ASX/* LP token staked, fetch reserves & totalSupply. Multiply reserves by (stakedLP / totalSupply) to derive underlying token amounts, add raw token balances.
- SDK handles pricing (via CoinGecko etc.).

## Files
- `projects/asx/index.js` — adapter implementation
- `package.json` — local dependencies (`@defillama/sdk`)

## Local Test
From `defillama-adapter` directory:

```bash
npm install
# optional debug
export LLAMA_DEBUG_MODE=true
node ../node_modules/@defillama/sdk/test.js projects/asx/index.js || node test.js projects/asx/index.js
```
(Depending on repo layout; if cloning upstream Adapters repo, use their provided `test.js` at root.)

## Usage (DefiLlama Submission)
1. Fork https://github.com/DefiLlama/DefiLlama-Adapters
2. Copy `projects/asx` folder into `projects/` in your fork (or replicate the code).
3. Commit & push.
4. Open PR with description:
   - Summary of contracts
   - Methodology (as above)
   - Deployment timestamp (update `start`).
5. Wait for merge (~24h for UI to reflect).

Update `start` timestamp before PR for accurate backfill.
