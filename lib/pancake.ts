import { getContract, prepareContractCall, sendTransaction, readContract } from "thirdweb";
import { client, bsc } from "./thirdweb";

export const PCS_V2_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

const PCS_V2_ROUTER_ABI = [
  "function addLiquidity(address tokenA,address tokenB,uint256 amountADesired,uint256 amountBDesired,uint256 amountAMin,uint256 amountBMin,address to,uint256 deadline) returns (uint256 amountA,uint256 amountB,uint256 liquidity)",
  "function removeLiquidity(address tokenA,address tokenB,uint256 liquidity,uint256 amountAMin,uint256 amountBMin,address to,uint256 deadline) returns (uint256 amountA,uint256 amountB)",
  "function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline) returns (uint256[] amounts)",
  "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)",
  "function getAmountsOut(uint256 amountIn,address[] path) view returns (uint256[] amounts)",
];

export function getPcsV2Router() {
  return getContract({ address: PCS_V2_ROUTER, abi: PCS_V2_ROUTER_ABI as any, client, chain: bsc });
}

export async function addLiquidity(params: {
  tokenA: string;
  tokenB: string;
  amountADesired: bigint;
  amountBDesired: bigint;
  amountAMin: bigint;
  amountBMin: bigint;
  to: string;
  deadline: bigint;
  account: any;
}) {
  const contract = getPcsV2Router();
  const tx = prepareContractCall({
    contract,
    method: PCS_V2_ROUTER_ABI[0],
    params: [
      params.tokenA,
      params.tokenB,
      params.amountADesired,
      params.amountBDesired,
      params.amountAMin,
      params.amountBMin,
      params.to,
      params.deadline,
    ],
  } as any);
  return await sendTransaction({ transaction: tx, account: params.account });
}

export async function removeLiquidity(params: {
  tokenA: string;
  tokenB: string;
  liquidity: bigint;
  amountAMin: bigint;
  amountBMin: bigint;
  to: string;
  deadline: bigint;
  account: any;
}) {
  const contract = getPcsV2Router();
  const tx = prepareContractCall({
    contract,
    method: PCS_V2_ROUTER_ABI[1],
    params: [
      params.tokenA,
      params.tokenB,
      params.liquidity,
      params.amountAMin,
      params.amountBMin,
      params.to,
      params.deadline,
    ],
  } as any);
  return await sendTransaction({ transaction: tx, account: params.account });
}

export async function swapExactTokensForTokens(params: {
  amountIn: bigint;
  amountOutMin: bigint;
  path: string[];
  to: string;
  deadline: bigint;
  account: any;
}) {
  const contract = getPcsV2Router();
  const tx = prepareContractCall({
    contract,
    method: PCS_V2_ROUTER_ABI[3],
    params: [params.amountIn, params.amountOutMin, params.path, params.to, params.deadline],
  } as any);
  return await sendTransaction({ transaction: tx, account: params.account });
}

export async function getAmountsOut(amountIn: bigint, path: string[]) {
  const contract = getPcsV2Router();
  return await readContract({
    contract,
    method: PCS_V2_ROUTER_ABI[4],
    params: [amountIn, path],
  } as any);
}
