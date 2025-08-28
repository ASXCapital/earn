const sdk = require('@defillama/sdk')

// Chain-specific ASX token addresses
const ASX_TOKEN = {
  bsc: '0xebd3619642d78f0c98c84f6fa9a678653fb5a99b'.toLowerCase(),
  core: '0xB28B43209d9de61306172Af0320f4f55e50E2f29'.toLowerCase(),
}

const SINGLE_STAKING = {
  bsc: ['0x26A699ebAFFd04B7Fd8D21445F247fD71e9dce5f'],
  core: ['0x9990C20f9F65c38AeA24D7941Afa6b3cA3DF7deD'],
}

// LP staking mapping (staking contract -> LP token)
const LP_STAKING = {
  bsc: [
    { staking: '0x5578bffb8D14821E52fd34198E5eF9d9cE968257', lp: '0x9f0faa9668cA7f0a0c1CeF0d267fcd3af388941B' }, // ASX/BNB
    { staking: '0xE6e897D7Eac4DdC8E320CB378060727b30A01220', lp: '0xA975604Aa84C1e925Cc236D1C489319eB783B1f4' }, // ASX/ETH
    { staking: '0x50f9CCA82084D0A1215e627944b629376A9c6070', lp: '0xc51e01569cd9ce5788Bd80ddE452ace981be5848' }, // ASX/BTCB
    { staking: '0x648fF88fB3e661dC5bb75FB4356483eda31DDdc8', lp: '0x93Cf6C75f0a468835C59687f39bf2661559b3b89' }, // ASX/SOL
  ],
  core: [],
}

const abi = {
  token0: { name: 'token0', stateMutability: 'view', type: 'function', inputs: [], outputs: [{ type: 'address', name: '' }] },
  token1: { name: 'token1', stateMutability: 'view', type: 'function', inputs: [], outputs: [{ type: 'address', name: '' }] },
  getReserves: { name: 'getReserves', stateMutability: 'view', type: 'function', inputs: [], outputs: [
    { type: 'uint112', name: 'reserve0' }, { type: 'uint112', name: 'reserve1' }, { type: 'uint32', name: 'blockTimestampLast' }
  ] },
  totalSupply: { name: 'totalSupply', stateMutability: 'view', type: 'function', inputs: [], outputs: [{ type: 'uint256', name: '' }] },
  stakingToken: { name: 'stakingToken', stateMutability: 'view', type: 'function', inputs: [], outputs: [{ type: 'address', name: '' }] },
}

async function staking(api) {
  const contracts = SINGLE_STAKING[api.chain] || []
  if (!contracts.length) return {}
  const asx = ASX_TOKEN[api.chain]
  let bals = await api.multiCall({ abi: 'erc20:balanceOf', calls: contracts.map(c => ({ target: asx, params: [c] })) }).catch(() => ({ output: contracts.map(()=>'0') }))
  if (bals && bals.output) bals = bals.output
  bals = Array.isArray(bals) ? bals : []
  let totalSupplies = await api.multiCall({ abi: abi.totalSupply, calls: contracts.map(c => ({ target: c })) }).catch(() => ({ output: [] }))
  if (totalSupplies && totalSupplies.output) totalSupplies = totalSupplies.output
  totalSupplies = Array.isArray(totalSupplies) ? totalSupplies.map(x => (x && x.output) ? x.output : x) : []
  let stakingTokens = await api.multiCall({ abi: abi.stakingToken, calls: contracts.map(c => ({ target: c })) }).catch(() => ({ output: [] }))
  if (stakingTokens && stakingTokens.output) stakingTokens = stakingTokens.output
  stakingTokens = Array.isArray(stakingTokens) ? stakingTokens.map(x => (x && x.output) ? x.output : x) : []
  contracts.forEach((c, i) => {
    const balRaw = bals[i] && typeof bals[i] === 'object' && 'output' in bals[i] ? bals[i].output : bals[i]
    const bal = BigInt(balRaw || 0)
    const ts = BigInt(totalSupplies[i] || 0)
    const stakingTok = (stakingTokens[i] || '').toLowerCase()
    let amount = bal
    if (stakingTok === asx && ts > amount) amount = ts
    if (amount > 0n) api.add(asx, amount)
  })
  return api.getBalances()
}

async function pool2(api) {
  const rawEntries = LP_STAKING[api.chain] || []
  if (!rawEntries.length) return {}
  const stakingContracts = rawEntries.map(e => typeof e === 'string' ? e : e.staking)
  const explicitLpMap = new Map(rawEntries.filter(e => typeof e === 'object' && e.lp).map((e) => [e.staking.toLowerCase(), e.lp.toLowerCase()]))
  let lpTokens = await api.multiCall({ abi: abi.stakingToken, calls: stakingContracts.filter(s => !explicitLpMap.has(s.toLowerCase())).map(s => ({ target: s })) })
  if (lpTokens.output) lpTokens = lpTokens.output
  lpTokens = Array.isArray(lpTokens) ? lpTokens.map(x => (x && x.output) ? x.output : x) : []
  const finalLpTokens = stakingContracts.map((s, i) => explicitLpMap.get(s.toLowerCase()) || lpTokens[i])
  let lpBalances = await api.multiCall({ abi: 'erc20:balanceOf', calls: finalLpTokens.map((lp, i) => ({ target: lp, params: [stakingContracts[i]] })) })
  let supplies = await api.multiCall({ abi: abi.totalSupply, calls: finalLpTokens.map(lp => ({ target: lp })) })
  let token0s = await api.multiCall({ abi: abi.token0, calls: finalLpTokens.map(lp => ({ target: lp })) })
  let token1s = await api.multiCall({ abi: abi.token1, calls: finalLpTokens.map(lp => ({ target: lp })) })
  let reserves = await api.multiCall({ abi: abi.getReserves, calls: finalLpTokens.map(lp => ({ target: lp })) })
  const norm = (arr) => (arr && arr.output ? arr.output : arr)
  lpBalances = norm(lpBalances); supplies = norm(supplies); token0s = norm(token0s); token1s = norm(token1s); reserves = norm(reserves)
  const flat = (arr) => Array.isArray(arr) ? arr.map(x => (x && typeof x === 'object' && 'output' in x ? x.output : x)) : []
  lpBalances = flat(lpBalances); supplies = flat(supplies); token0s = flat(token0s); token1s = flat(token1s); reserves = flat(reserves)
  stakingContracts.forEach((_, i) => {
    const supply = supplies[i]; const staked = lpBalances[i]
    if (!supply || supply === '0') return
    const rv = reserves[i]
    let r0, r1
    if (rv && typeof rv === 'object' && 'reserve0' in rv) { r0 = rv.reserve0; r1 = rv.reserve1 }
    else if (Array.isArray(rv)) { r0 = rv[0]; r1 = rv[1] }
    const portion = BigInt(staked || 0) * 10n ** 18n / BigInt(supply)
    const amt0 = BigInt(r0 || 0) * portion / 10n ** 18n
    const amt1 = BigInt(r1 || 0) * portion / 10n ** 18n
    api.add(token0s[i], amt0)
    api.add(token1s[i], amt1)
  })
  return api.getBalances()
}

async function tvl() { return {} }

module.exports = {
  methodology: 'staking: ASX tokens in single-asset staking contracts. pool2: underlying reserves of staked ASX/* Pancake LP tokens (proportional).',
  timetravel: true,
  misrepresentedTokens: false,
  start: 1724800000, // replace with unix timestamp of earliest of BSC block 33344678 or Core block 12932506
  hallmarks: [
    // [timestamp, description] (timestamps can be backfilled later once exact block times confirmed)
  ],
  bsc: { tvl, staking, pool2 },
  core: { tvl, staking },
}
