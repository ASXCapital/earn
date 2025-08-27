import { client, bsc, core } from './thirdweb';
import { getContract, readContract, prepareContractCall, sendTransaction } from 'thirdweb';

export const STAKING_ABI = [
    { "inputs": [{ "internalType": "address", "name": "_stakingToken", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "token", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Recovered", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256" }], "name": "RewardAdded", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "rewardAddress", "type": "address" }, { "indexed": true, "internalType": "address", "name": "distributor", "type": "address" }, { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" }], "name": "RewardDistributorApproved", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": true, "internalType": "address", "name": "rewardsToken", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256" }], "name": "RewardPaid", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "rewardTokenAddress", "type": "address" }], "name": "RewardTokenAdded", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Staked", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Withdrawn", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256" }], "name": "WithrewTeamReward", "type": "event" },
    { "inputs": [{ "internalType": "address", "name": "_rewardsToken", "type": "address" }, { "internalType": "address", "name": "_distributor", "type": "address" }], "name": "addReward", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "_rewardsToken", "type": "address" }, { "internalType": "address", "name": "_distributor", "type": "address" }, { "internalType": "bool", "name": "_approved", "type": "bool" }], "name": "approveRewardDistributor", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "canWithdraw", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "claimableRewards", "outputs": [{ "components": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "internalType": "struct RewardPool.ClaimableData[]", "name": "_rewards", "type": "tuple[]" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "delayToWithdraw", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "exit", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "getReward", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "_rewardsToken", "type": "address" }], "name": "getRewardForDuration", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "_rewardsToken", "type": "address" }], "name": "lastTimeRewardApplicable", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "_rewardsToken", "type": "address" }, { "internalType": "uint256", "name": "reward", "type": "uint256" }], "name": "notifyRewardAmount", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "tokenAddress", "type": "address" }, { "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }], "name": "recoverERC20", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "rewardData", "outputs": [{ "internalType": "uint256", "name": "periodFinish", "type": "uint256" }, { "internalType": "uint256", "name": "rewardRate", "type": "uint256" }, { "internalType": "uint256", "name": "lastUpdateTime", "type": "uint256" }, { "internalType": "uint256", "name": "rewardPerTokenStored", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "address", "name": "", "type": "address" }], "name": "rewardDistributors", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "_rewardsToken", "type": "address" }], "name": "rewardPerToken", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "rewardTokens", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "address", "name": "", "type": "address" }], "name": "rewards", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "rewardsDuration", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "_delayToWithdraw", "type": "uint256" }], "name": "setDelayToWithdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "stake", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "stakedTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "stakingToken", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "_rewardsDuration", "type": "uint256" }], "name": "updateRewardsDuration", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "address", "name": "", "type": "address" }], "name": "userRewardPerTokenPaid", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];
// Factory
export function getStakingContract(address: string, chain: 'bsc' | 'core' = 'core') {
    // Provide ABI so method signature decoding works even if using raw fragments
    return getContract({ address, abi: STAKING_ABI as any, client, chain: chain === 'bsc' ? bsc : core });
}

// Read helpers
export async function getStakedBalance(contract: any, account: string) {
    return await readContract({ contract, method: 'function balanceOf(address user) view returns (uint256 amount)', params: [account] } as any);
}
export async function getTotalSupply(contract: any) {
    return await readContract({ contract, method: 'function totalSupply() view returns (uint256)' } as any);
}
export async function getClaimableRewards(contract: any, account: string) {
    const signatures = [
        'function claimableRewards(address) view returns (tuple(address token,uint256 amount)[])',
        'function claimableRewards(address) view returns (tuple(address,uint256)[])',
        'function claimableRewards(address) view returns ((address,uint256)[])'
    ];
    let lastErr: any;
    for (const method of signatures) {
        try {
            return await readContract({ contract, method, params: [account] } as any);
        } catch (e: any) { lastErr = e; }
    }
    throw lastErr;
}
export async function getRewardTokens(contract: any) {
    // Try first 8 indices
    const tokens: string[] = [];
    for (let i = 0; i < 8; i++) {
        try {
            const raw: any = await readContract({ contract, method: 'function rewardTokens(uint256) view returns (address)', params: [BigInt(i)] } as any);
            const t = String(raw);
            if (!t || t === '0x0000000000000000000000000000000000000000') break;
            tokens.push(t);
        } catch { break; }
    }
    return tokens;
}
export async function getRewardData(contract: any, token: string) {
    const raw: any = await readContract({ contract, method: 'function rewardData(address) view returns (uint256 periodFinish,uint256 rewardRate,uint256 lastUpdateTime,uint256 rewardPerTokenStored)', params: [token] } as any);
    if (raw && Array.isArray(raw) && raw.length >= 4) {
        return { periodFinish: raw[0], rewardRate: raw[1], lastUpdateTime: raw[2], rewardPerTokenStored: raw[3] };
    }
    return raw; // might already be decoded object in future versions
}
export async function getRewardRate(contract: any, token: string) {
    const data: any = await getRewardData(contract, token);
    if (data && typeof data === 'object' && 'rewardRate' in data) return (data as any).rewardRate;
    if (Array.isArray(data) && data.length >= 2) return data[1];
    return 0n;
}
export async function getRewardsDuration(contract: any) {
    return await readContract({ contract, method: 'function rewardsDuration() view returns (uint256)' } as any);
}
export async function getStakingToken(contract: any) {
    return await readContract({ contract, method: 'function stakingToken() view returns (address)' } as any);
}
export async function getCanWithdraw(contract: any, account: string) {
    return await readContract({ contract, method: 'function canWithdraw(address account) view returns (bool)', params: [account] } as any);
}
export async function getDelayToWithdraw(contract: any) {
    return await readContract({ contract, method: 'function delayToWithdraw() view returns (uint256)' } as any);
}
export async function getStakedTime(contract: any, account: string) {
    return await readContract({ contract, method: 'function stakedTime(address account) view returns (uint256)', params: [account] } as any);
}

// --- Generic ERC20 metadata helpers (used for formatting) ---
export async function getErc20Decimals(address: string, chain: 'bsc' | 'core') {
    const contract = getStakingContract(address, chain); // reuse getContract with staking ABI? we need ERC20 ABI fragment; use readContract directly
    try {
        const v: any = await readContract({ contract: { ...contract, address } as any, method: 'function decimals() view returns (uint8)' } as any);
        return typeof v === 'number' ? v : (Array.isArray(v) ? Number(v[0]) : Number(v));
    } catch {
        return 18; // default
    }
}
export async function getErc20Symbol(address: string, chain: 'bsc' | 'core') {
    const contract = getStakingContract(address, chain);
    try {
        const v: any = await readContract({ contract: { ...contract, address } as any, method: 'function symbol() view returns (string)' } as any);
        return typeof v === 'string' ? v : (Array.isArray(v) ? String(v[0]) : String(v));
    } catch {
        return 'TOKEN';
    }
}

// Generic ERC20 balance
export async function getErc20Balance(address: string, account: string, chain: 'bsc' | 'core') {
    const contract = getStakingContract(address, chain);
    return await readContract({ contract: { ...contract, address } as any, method: 'function balanceOf(address) view returns (uint256)', params: [account] } as any);
}

// ERC20 allowance & approve
export async function getErc20Allowance(token: string, owner: string, spender: string, chain: 'bsc' | 'core') {
    const contract = getStakingContract(token, chain);
    return await readContract({ contract: { ...contract, address: token } as any, method: 'function allowance(address owner,address spender) view returns (uint256)', params: [owner, spender] } as any);
}
export async function approveErc20(token: string, spender: string, amount: bigint, chain: 'bsc' | 'core', account: any) {
    const contract = getStakingContract(token, chain);
    const tx = prepareContractCall({ contract: { ...contract, address: token } as any, method: 'function approve(address spender,uint256 amount) returns (bool)', params: [spender, amount] } as any);
    return await sendTransaction({ transaction: tx, account });
}

// Staking writes
export async function stakeTokens(contract: any, amount: bigint, account: any) {
    const tx = prepareContractCall({ contract, method: 'function stake(uint256 amount)', params: [amount] } as any);
    return await sendTransaction({ transaction: tx, account });
}
export async function withdrawTokens(contract: any, amount: bigint, account: any) {
    const tx = prepareContractCall({ contract, method: 'function withdraw(uint256 amount)', params: [amount] } as any);
    return await sendTransaction({ transaction: tx, account });
}
export async function claimRewards(contract: any, account: any) {
    const tx = prepareContractCall({ contract, method: 'function getReward()' } as any);
    return await sendTransaction({ transaction: tx, account });
}
export async function exitStaking(contract: any, account: any) {
    const tx = prepareContractCall({ contract, method: 'function exit()' } as any);
    return await sendTransaction({ transaction: tx, account });
}
