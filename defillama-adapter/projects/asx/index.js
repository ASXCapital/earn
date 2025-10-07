// ASX addresses by chain
const ASX_TOKEN = {
  bsc: '0xebd3619642d78f0c98c84f6fa9a678653fb5a99b',
  core: '0xb28b43209d9de61306172af0320f4f55e50e2f29',
}

const SINGLE_STAKING = {
  bsc: ['0x26A699ebAFFd04B7Fd8D21445F247fD71e9dce5f'],
  core: ['0x9990C20f9F65c38AeA24D7941Afa6b3cA3DF7deD'],
}

// LP staking entries (staking contract -> LP token)
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

const PRECISION = 10n ** 18n

const toLower = (value) => (value || '').toString().toLowerCase()
const unwrapOutput = (value) => (value && typeof value === 'object' && 'output' in value ? value.output : value)
const toArray = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value.map(unwrapOutput)
  if (typeof value === 'object' && 'output' in value) return toArray(value.output)
  return []
}
const toBigIntSafe = (value) => {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(Math.trunc(value))
  if (typeof value === 'string' && value) return BigInt(value)
  if (value && typeof value === 'object') {
    if (value._hex) return BigInt(value._hex)
    if (value.hex) return BigInt(value.hex)
    if ('output' in value) return toBigIntSafe(value.output)
  }
  return 0n
}

async function staking(api) {
  const contracts = SINGLE_STAKING[api.chain] || []
  if (!contracts.length) return {}
  const asx = toLower(ASX_TOKEN[api.chain])
  if (!asx) return {}

  let balances
  try {
    balances = await api.multiCall({ abi: 'erc20:balanceOf', calls: contracts.map((contract) => ({ target: asx, params: [contract] })) })
  } catch (e) {
    balances = contracts.map(() => '0')
  }
  balances = toArray(balances)

  let totalSupplies
  try {
    totalSupplies = await api.multiCall({ abi: abi.totalSupply, calls: contracts.map((contract) => ({ target: contract })) })
  } catch (e) {
    totalSupplies = []
  }
  totalSupplies = toArray(totalSupplies)

  let stakingTokens
  try {
    stakingTokens = await api.multiCall({ abi: abi.stakingToken, calls: contracts.map((contract) => ({ target: contract })) })
  } catch (e) {
    stakingTokens = []
  }
  stakingTokens = toArray(stakingTokens).map(toLower)

  contracts.forEach((_, idx) => {
    const amount = toBigIntSafe(balances[idx])
    const supply = toBigIntSafe(totalSupplies[idx])
    const stakingToken = stakingTokens[idx]

    let tracked = amount
    if (stakingToken === asx && supply > tracked) tracked = supply
    if (tracked > 0n) api.add(asx, tracked)
  })

  return api.getBalances()
}

async function pool2(api) {
  const rawEntries = LP_STAKING[api.chain] || []
  if (!rawEntries.length) return {}

  const normalizedEntries = rawEntries.map((entry) => (
    typeof entry === 'string'
      ? { staking: entry, lp: null }
      : { staking: entry.staking, lp: entry.lp || null }
  ))

  const explicitLpMap = new Map(
    normalizedEntries
      .filter((entry) => entry.lp)
      .map((entry) => [toLower(entry.staking), toLower(entry.lp)])
  )

  const missingStakingContracts = normalizedEntries
    .filter((entry) => !explicitLpMap.has(toLower(entry.staking)))
    .map((entry) => entry.staking)

  let discoveredLps = []
  if (missingStakingContracts.length) {
    const response = await api.multiCall({
      abi: abi.stakingToken,
      calls: missingStakingContracts.map((contract) => ({ target: contract })),
    })
    const resolved = toArray(response)
    discoveredLps = missingStakingContracts.map((contract, idx) => ({
      staking: contract,
      lp: resolved[idx],
    }))
  }

  const lpMap = new Map(explicitLpMap)
  discoveredLps.forEach(({ staking, lp }) => {
    if (lp) lpMap.set(toLower(staking), toLower(lp))
  })

  const pairs = normalizedEntries
    .map((entry) => ({ staking: entry.staking, lp: lpMap.get(toLower(entry.staking)) }))
    .filter((entry) => !!entry.lp)

  if (!pairs.length) return {}

  const lpBalances = toArray(await api.multiCall({
    abi: 'erc20:balanceOf',
    calls: pairs.map(({ lp, staking }) => ({ target: lp, params: [staking] })),
  }))
  const supplies = toArray(await api.multiCall({
    abi: abi.totalSupply,
    calls: pairs.map(({ lp }) => ({ target: lp })),
  }))
  const token0s = toArray(await api.multiCall({
    abi: abi.token0,
    calls: pairs.map(({ lp }) => ({ target: lp })),
  })).map(toLower)
  const token1s = toArray(await api.multiCall({
    abi: abi.token1,
    calls: pairs.map(({ lp }) => ({ target: lp })),
  })).map(toLower)
  const reserves = toArray(await api.multiCall({
    abi: abi.getReserves,
    calls: pairs.map(({ lp }) => ({ target: lp })),
  }))

  pairs.forEach((_, idx) => {
    const supply = toBigIntSafe(supplies[idx])
    const staked = toBigIntSafe(lpBalances[idx])
    const token0 = token0s[idx]
    const token1 = token1s[idx]
    if (!supply || !staked || !token0 || !token1) return

    const reserveData = reserves[idx]
    let r0 = 0n
    let r1 = 0n
    if (reserveData && typeof reserveData === 'object' && 'reserve0' in reserveData) {
      r0 = toBigIntSafe(reserveData.reserve0)
      r1 = toBigIntSafe(reserveData.reserve1)
    } else if (Array.isArray(reserveData)) {
      r0 = toBigIntSafe(reserveData[0])
      r1 = toBigIntSafe(reserveData[1])
    }
    if (!r0 && !r1) return

    const portion = (staked * PRECISION) / supply
    const amt0 = (r0 * portion) / PRECISION
    const amt1 = (r1 * portion) / PRECISION

    if (amt0 > 0n) api.add(token0, amt0)
    if (amt1 > 0n) api.add(token1, amt1)
  })

  return api.getBalances()
}

async function tvl() {
  return {}
}

module.exports = {
  methodology: 'staking: ASX staking contracts on BSC & Core (raw ASX balances). pool2: ASX/BNB, ASX/ETH, ASX/BTCB & ASX/SOL Pancake LP staking positions, valued via proportional reserves.',
  timetravel: true,
  misrepresentedTokens: false,
  start: 1699540122, // earliest supported block (BSC block 33344678)
  hallmarks: [
    // [unixTimestamp, description]
  ],
  bsc: { tvl, staking, pool2 },
  core: { tvl, staking },
}
