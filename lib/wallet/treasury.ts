import { createPublicClient, createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";
import type { HDAccount } from "viem/accounts";
import { env } from "../env";

let _publicClient: ReturnType<typeof createPublicClient> | null = null;

export function getPublicClient() {
  if (!_publicClient) {
    _publicClient = createPublicClient({
      chain: mainnet,
      transport: http(env.rpcHttp()),
    });
  }
  return _publicClient;
}

/**
 * Wallet client bound to a specific derived account. Created on-demand
 * (e.g. when sweeping funds or processing a withdrawal) and not cached
 * beyond the scope of that operation.
 */
export function getWalletClientFor(account: HDAccount) {
  return createWalletClient({
    account,
    chain: mainnet,
    transport: http(env.rpcHttp()),
  });
}
