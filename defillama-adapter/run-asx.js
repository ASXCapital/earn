// Minimal ESM runner to invoke adapter functions similar to DefiLlama test harness
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const adapter = require('./projects/asx/index.js')
import sdk from '@defillama/sdk'
import { ethers } from 'ethers'

// Inject Core chain provider locally (DefiLlama infra supplies this in production)
const coreRpc = process.env.CORE_RPC || 'https://rpc.coredao.org';
try {
  sdk.api.config.setProvider('core', new ethers.JsonRpcProvider(coreRpc));
} catch (e) { /* ignore if already set or unsupported */ }

function makeApi(chain, timestamp) {
  // Minimal mock replicating needed surface of api used in adapter
  const balances = {}
  return {
    chain,
    timestamp,
      call: async (p) => sdk.api.abi.call({ chain, ...p }),
      multiCall: async ({ abi, calls }) => {
        try {
          return await sdk.api.abi.multiCall({ abi, calls, chain });
        } catch (e) {
          // Fallback: execute sequentially if multicall unsupported
          const output = [];
          for (const c of calls) {
            try {
              const res = await sdk.api.abi.call({ abi, target: c.target || c.contract || c, params: c.params, chain });
              output.push(res.output);
            } catch (err) { output.push('0'); }
          }
          return { output };
        }
      },
    add: (token, bal) => { const k = token.toLowerCase(); balances[k] = (BigInt(bal) + BigInt(balances[k] || 0n)).toString(); },
    getBalances: () => balances,
  }
}

async function run() {
  const chain = process.argv[2] || 'bsc'
  const ts = Math.floor(Date.now()/1000)
  console.log('Running ASX adapter for chain', chain, 'timestamp', ts)
  if (adapter[chain] && adapter[chain].staking) {
    const stakingApi = makeApi(chain, ts)
    await adapter[chain].staking(stakingApi)
    console.log('Staking balances:', stakingApi.getBalances())
  }
  if (adapter[chain] && adapter[chain].pool2) {
    const pool2Api = makeApi(chain, ts)
    await adapter[chain].pool2(pool2Api)
    console.log('Pool2 balances:', pool2Api.getBalances())
  }
  if (adapter[chain] && adapter[chain].tvl) {
    const baseApi = makeApi(chain, ts)
    await adapter[chain].tvl(baseApi)
    console.log('Base TVL balances:', baseApi.getBalances())
  }
}
run().catch(e => { console.error(e); process.exit(1) })
