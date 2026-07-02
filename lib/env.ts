import { deriveAccountForIndex } from "./wallet/hdWallet";
import { getWalletClientFor, getPublicClient } from "./wallet/viemClients";
import { erc20Abi } from "./wallet/erc20";
import { env } from "../env";

const TREASURY_INDEX = 0;

export function getTreasuryAccount() {
  return deriveAccountForIndex(TREASURY_INDEX);
}

/**
 * Sends ETH from the treasury wallet to a destination address.
 * Assumes the treasury has already been funded by sweeps from user
 * deposit addresses (see scripts/sweep.ts for that job).
 */
export async function sendEthFromTreasury(to: `0x${string}`, amountWei: bigint) {
  const account = getTreasuryAccount();
  const wallet = getWalletClientFor(account);
  return wallet.sendTransaction({ to, value: amountWei });
}

export async function sendUsdtFromTreasury(to: `0x${string}`, amountUnits: bigint) {
  const account = getTreasuryAccount();
  const wallet = getWalletClientFor(account);
  return wallet.writeContract({
    address: env.usdtAddress(),
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, amountUnits],
  });
}

export async function getTreasuryEthBalance() {
  const client = getPublicClient();
  return client.getBalance({ address: getTreasuryAccount().address });
}
