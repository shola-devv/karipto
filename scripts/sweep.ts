/**
 * Sweeps confirmed deposits from individual user addresses into the
 * treasury wallet, so withdrawals (which pay out from treasury) always
 * have funds available. Run this periodically (e.g. every few minutes),
 * separately from the deposit scanner.
 *
 * NOTE: each user's deposit address needs a small amount of ETH to pay
 * gas for its own sweep transaction (both for sweeping its own ETH and
 * for sweeping USDT, since ERC20 transfers still cost ETH gas). A common
 * pattern is a small "gas top-up" transfer from treasury to a deposit
 * address immediately before sweeping it. That top-up step is not
 * implemented here — this script is a starting point, not a complete
 * production sweeper.
 */
import "dotenv/config";
import { dbConnect } from "../lib/mongodb";
import User from "../lib/models/User";
import { deriveAccountForIndex } from "../lib/wallet/hdWallet";
import { getWalletClientFor, getPublicClient } from "../lib/wallet/viemClients";
import { getTreasuryAccount } from "../lib/wallet/treasury";
import { erc20Abi } from "../lib/wallet/erc20";
import { env } from "../lib/env";
import { getChainByKey, getChainById } from "../lib/chains";

const MIN_ETH_TO_SWEEP = 1_000_000_000_000_000n; // 0.001 ETH, avoid dust/uneconomical sweeps

async function sweepUser(user: InstanceType<typeof User>) {
  const account = deriveAccountForIndex(user.derivationIndex);
  const chainKey = process.env.SWEEP_CHAIN || "mainnet";
  const chain = getChainByKey(chainKey) || getChainById(1)!;
  const wallet = getWalletClientFor(account, chain.chainId);
  const client = getPublicClient(chain.chainId);
  const treasury = getTreasuryAccount().address;

  const ethBalance = await client.getBalance({ address: account.address });
  const usdtBalance = await client.readContract({
    address: env.usdtAddress(),
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });

  if (usdtBalance > 0n) {
    // Requires this address to already hold enough ETH for gas (see note above).
    await wallet.writeContract({
      chain: chain.viemChain,
      address: env.usdtAddress(),
      abi: erc20Abi,
      functionName: "transfer",
      args: [treasury, usdtBalance],
    });
    console.log(`[sweep] moved ${usdtBalance} USDT units from ${account.address}`);
  }

  if (ethBalance > MIN_ETH_TO_SWEEP) {
    const gasReserve = 21_000n * 30_000_000_000n; // rough reserve for a simple transfer
    const sendable = ethBalance - gasReserve;
      if (sendable > 0n) {
      await wallet.sendTransaction({ chain: chain.viemChain, to: treasury, value: sendable });
      console.log(`[sweep] moved ${sendable} wei from ${account.address}`);
    }
  }
}

async function main() {
  await dbConnect();
  const users = await User.find({});
  for (const user of users) {
    try {
      await sweepUser(user);
    } catch (err) {
      console.error(`[sweep] failed for ${user.depositAddress}`, err);
    }
  }
  process.exit(0);
}

main();
