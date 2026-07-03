import { mnemonicToAccount, type HDAccount } from "viem/accounts";
import { getPublicClient } from "./viemClients";
import { getChainById } from "@/lib/chains";
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

/**
 * Derive the deposit account for a given user index.
 * Deterministic: same index always yields the same address.
 */
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

export async function runDepositScan(chainId?: number) {
  const cid = chainId || 1;
  const chain = getChainById(cid);
  const client = getPublicClient(cid);

  // TODO: implement per-chain scanning logic. For now return minimal shape.
  return {
    scannedFrom: 0n,
    scannedTo: 0n,
    latest: 0n,
  };
}
