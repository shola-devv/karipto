import { mnemonicToAccount, type HDAccount } from "viem/accounts";
import { getPublicClient } from "./viemClients";
import { getChainById } from "@/lib/chains";
import { dbConnect } from "../mongodb";
import User from "../models/User";
import Deposit from "../models/Deposit";
import ScanCursor from "../models/ScanCursor";
import { env } from "../env";

/**
 * SECURITY NOTES
 * ----------------------------------------------------------------------
 * - The master mnemonic/seed is the single most sensitive secret in this
 *   system: anyone who has it controls every user's deposit address.
 * - In this reference implementation it's read from an env var for local
 *   dev only. In production, replace `getMasterMnemonic()` with a call to
 *   your KMS/HSM (AWS KMS, GCP KMS, HashiCorp Vault, Fireblocks, etc.)
 *   that returns the seed in-memory and is never written to disk or logs.
 * - We NEVER store a derived private key anywhere. Every derivation below
 *   is done fresh, held only in memory for the duration of the call, and
 *   discarded. Only the *derivation index* (a plain integer, not secret
 *   on its own) is persisted per user.
 * - Standard BIP44 path for Ethereum: m/44'/60'/0'/0/{index}
 */

function getMasterMnemonic(): string {
  return env.masterMnemonic();
}

export function deriveAccountForIndex(index: number): HDAccount {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error("Derivation index must be a non-negative integer");
  }
  return mnemonicToAccount(getMasterMnemonic(), {
    addressIndex: index,
  });
}

export function deriveAddressForIndex(index: number): `0x${string}` {
  return deriveAccountForIndex(index).address;
}

// ---------------------------------------------------------------------
// Deposit scanning
// ---------------------------------------------------------------------

const SCAN_BATCH_BLOCKS = Number(process.env.SCAN_BATCH_BLOCKS || "200");

// Free-tier Alchemy (and most free RPC tiers) cap eth_getLogs at a 10-block
// range per call. Every getLogs call in this file goes through the chunking
// helper below so we never send a wider range than this.
const MAX_GETLOGS_RANGE = Number(process.env.RPC_MAX_GETLOGS_RANGE || "10");

const RPC_CALL_DELAY_MS = Number(process.env.RPC_CALL_DELAY_MS || "150");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkBlockRange(from: bigint, to: bigint, size: bigint): [bigint, bigint][] {
  const chunks: [bigint, bigint][] = [];
  let start = from;
  while (start <= to) {
    const end = start + size - 1n > to ? to : start + size - 1n;
    chunks.push([start, end]);
    start = end + 1n;
  }
  return chunks;
}

// keccak256("Transfer(address,address,uint256)") — the ERC20 Transfer event
// signature hash. Passed as a raw topic instead of via viem's `event:`
// encoding, since some RPC backends (Alchemy included) reject the flat
// single-string topics array that `event:`-based getLogs produces and only
// accept each topic position wrapped in its own array.
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" as const;

async function getCursor(chainKey: string, startFallback: number): Promise<number> {
  const doc = await ScanCursor.findById(chainKey);
  return doc ? doc.lastScannedBlock : startFallback;
}

async function saveCursor(chainKey: string, block: number) {
  await ScanCursor.findByIdAndUpdate(chainKey, { lastScannedBlock: block }, { upsert: true });
}

/** Extracts a 20-byte address out of a 32-byte indexed topic value. */
function addressFromTopic(topic: string): `0x${string}` {
  return `0x${topic.slice(-40)}` as `0x${string}`;
}

/**
 * Scans a block range for USDT Transfer events landing on any of our deposit
 * addresses. Uses raw `topics` (nested-array form) instead of viem's `event:`
 * param, and decodes the log manually — this avoids the RPC-side
 * "untagged enum Variadic" rejection some backends throw on the flat topics
 * array shape viem's event-based encoding produces.
 */
async function scanUsdtRange(chainId: number, fromBlock: bigint, toBlock: bigint) {
  const chain = getChainById(chainId);
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`);
  const client = getPublicClient(chainId);

  const chunks = chunkBlockRange(fromBlock, toBlock, BigInt(MAX_GETLOGS_RANGE));
  const allLogs: Awaited<ReturnType<typeof client.getLogs>> = [];

  for (const [chunkFrom, chunkTo] of chunks) {
    const logs = await client.getLogs({
      address: chain.usdtAddress as `0x${string}`,
      // Nested array = "topic position 0 must be one of these values" —
      // the spec-compliant OR form, and the format known to work reliably
      // against Alchemy's backend.
      topics: [[TRANSFER_TOPIC]],
      fromBlock: chunkFrom,
      toBlock: chunkTo,
    });
    allLogs.push(...logs);
    if (chunks.length > 1) await sleep(RPC_CALL_DELAY_MS);
  }

  if (allLogs.length === 0) return;

  // Manually decode: topics[1] = from (indexed), topics[2] = to (indexed),
  // data = value (uint256, not indexed). No ABI decoding needed.
  const decoded = allLogs
    .filter((l) => l.topics.length >= 3 && l.data)
    .map((l) => ({
      log: l,
      from: addressFromTopic(l.topics[1]!),
      to: addressFromTopic(l.topics[2]!),
      value: BigInt(l.data),
    }));

  const toAddresses = [...new Set(decoded.map((d) => d.to.toLowerCase()))];
  const matchedUsers = await User.find({ depositAddress: { $in: toAddresses } });
  if (matchedUsers.length === 0) return;
  const byAddress = new Map(matchedUsers.map((u) => [u.depositAddress, u]));

  for (const d of decoded) {
    const to = d.to.toLowerCase();
    const user = byAddress.get(to);
    if (!user) continue;

    try {
      await Deposit.updateOne(
        {
          chainId,
          txHash: d.log.transactionHash!.toLowerCase(),
          asset: "USDT",
          logIndex: d.log.logIndex,
        },
        {
          $setOnInsert: {
            userId: user._id,
            chainId,
            asset: "USDT",
            txHash: d.log.transactionHash!.toLowerCase(),
            logIndex: d.log.logIndex,
            blockNumber: Number(d.log.blockNumber),
            amount: d.value.toString(),
            fromAddress: d.from.toLowerCase(),
            toAddress: to,
            status: "pending",
          },
        },
        { upsert: true }
      );
    } catch {
      // Duplicate key = already recorded from a prior/overlapping scan.
    }
  }
}

async function scanEthRange(chainId: number, fromBlock: bigint, toBlock: bigint) {
  const client = getPublicClient(chainId);

  for (let b = fromBlock; b <= toBlock; b++) {
    const block = await client.getBlock({ blockNumber: b, includeTransactions: true });
    await sleep(RPC_CALL_DELAY_MS);

    const candidates = block.transactions.filter(
      (tx) => typeof tx !== "string" && tx.to && tx.value > 0n
    ) as Exclude<(typeof block.transactions)[number], string>[];
    if (candidates.length === 0) continue;

    const toAddresses = [...new Set(candidates.map((tx) => tx.to!.toLowerCase()))];
    const matchedUsers = await User.find({ depositAddress: { $in: toAddresses } });
    if (matchedUsers.length === 0) continue;
    const byAddress = new Map(matchedUsers.map((u) => [u.depositAddress, u]));

    for (const tx of candidates) {
      const to = tx.to!.toLowerCase();
      const user = byAddress.get(to);
      if (!user) continue;

      try {
        await Deposit.updateOne(
          { chainId, txHash: tx.hash.toLowerCase(), asset: "ETH", logIndex: { $exists: false } },
          {
            $setOnInsert: {
              userId: user._id,
              chainId,
              asset: "ETH",
              txHash: tx.hash.toLowerCase(),
              blockNumber: Number(b),
              amount: tx.value.toString(),
              fromAddress: tx.from.toLowerCase(),
              toAddress: to,
              status: "pending",
            },
          },
          { upsert: true }
        );
      } catch {
        // Already recorded.
      }
    }
  }
}

async function confirmAndCredit(chainId: number, currentBlock: bigint) {
  const chain = getChainById(chainId);
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`);
  const pending = await Deposit.find({ chainId, status: { $in: ["pending", "confirmed"] } });

  for (const dep of pending) {
    const confirmations = Number(currentBlock) - dep.blockNumber;
    if (confirmations < 0) continue;

    if (confirmations < chain.confirmations) {
      if (dep.confirmations !== confirmations) {
        await Deposit.updateOne({ _id: dep._id }, { confirmations });
      }
      continue;
    }

    const claimed = await Deposit.findOneAndUpdate(
      { _id: dep._id, status: { $ne: "credited" } },
      { status: "credited", confirmations, creditedAt: new Date() },
      { new: true }
    );
    if (!claimed) continue;

    const inc = await User.updateOne(
      { _id: claimed.userId, balances: { $elemMatch: { chainId, asset: claimed.asset } } },
      [
        {
          $set: {
            balances: {
              $map: {
                input: "$balances",
                as: "b",
                in: {
                  $cond: [
                    { $and: [{ $eq: ["$$b.chainId", chainId] }, { $eq: ["$$b.asset", claimed.asset] }] },
                    {
                      chainId: "$$b.chainId",
                      asset: "$$b.asset",
                      amount: {
                        $toString: {
                          $add: [{ $toDecimal: "$$b.amount" }, { $toDecimal: claimed.amount }],
                        },
                      },
                    },
                    "$$b",
                  ],
                },
              },
            },
          },
        },
      ]
    );

    if (inc.matchedCount === 0) {
      await User.updateOne(
        { _id: claimed.userId },
        { $push: { balances: { chainId, asset: claimed.asset, amount: claimed.amount } } }
      );
    }
  }
}

export async function runDepositScan(chainId?: number) {
  await dbConnect();
  const cid = chainId ?? 1;
  const chain = getChainById(cid);
  if (!chain) throw new Error(`Unsupported chainId: ${cid}`);
  const client = getPublicClient(cid);

  const latest = await client.getBlockNumber();
  const safeHead = latest - 1n;

  const startFallback = Number(safeHead) - SCAN_BATCH_BLOCKS;
  const from = BigInt(Math.max(await getCursor(chain.key, startFallback), 0));

  if (from > safeHead) {
    await confirmAndCredit(cid, latest);
    return { chainId: cid, scannedFrom: from, scannedTo: from, latest };
  }

  const batchSize = BigInt(SCAN_BATCH_BLOCKS);
  const to = from + batchSize > safeHead ? safeHead : from + batchSize;

  await scanUsdtRange(cid, from, to);
  await scanEthRange(cid, from, to);
  await saveCursor(chain.key, Number(to) + 1);
  await confirmAndCredit(cid, latest);

  return { chainId: cid, scannedFrom: from, scannedTo: to, latest };
}