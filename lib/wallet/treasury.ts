import { erc20Abi } from "./erc20";
import { deriveAccountForIndex } from "./hdWallet";
import { getWalletClientFor } from "./viemClients";
import { getChainById, CHAINS } from "@/lib/chains";

export function getTreasuryAccount() {
  return deriveAccountForIndex(0);
}

export async function sendEthFromTreasury(chainId: number, to: `0x${string}`, amountWei: bigint) {
  const chain = getChainById(chainId) || CHAINS[0];
  const wallet = getWalletClientFor(getTreasuryAccount(), chain.chainId);
  return wallet.sendTransaction({ chain: chain.viemChain, to, value: amountWei });
}

export async function sendUsdtFromTreasury(chainId: number, to: `0x${string}`, amountUnits: bigint) {
  const chain = getChainById(chainId) || CHAINS[0];
  const wallet = getWalletClientFor(getTreasuryAccount(), chain.chainId);
  return wallet.writeContract({
    chain: chain.viemChain,
    address: (chain.usdtAddress as `0x${string}`) || process.env.USDT_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, amountUnits],
  });
}
