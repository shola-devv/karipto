import { createPublicClient, createWalletClient, http } from "viem";
import type { HDAccount } from "viem/accounts";
import { CHAINS, getChainById } from "@/lib/chains";

const publicClientCache = new Map<number, ReturnType<typeof createPublicClient>>();

export function getPublicClient(chainId: number) {
  const cached = publicClientCache.get(chainId);
  if (cached) return cached;
  const chain = getChainById(chainId) || CHAINS[0];
  const rpc = process.env[chain.rpcEnvVar] || process.env.RPC_URL_HTTP;
  const client = createPublicClient({ chain: chain.viemChain, transport: http(rpc) });
  publicClientCache.set(chain.chainId, client as ReturnType<typeof createPublicClient>);
  return client;
}

export function getWalletClientFor(account: HDAccount, chainId: number) {
  const chain = getChainById(chainId) || CHAINS[0];
  const rpc = process.env[chain.rpcEnvVar] || process.env.RPC_URL_HTTP;
  return createWalletClient({ account, chain: chain.viemChain, transport: http(rpc) });
}
