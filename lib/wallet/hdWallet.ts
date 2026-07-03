import { mnemonicToAccount, type HDAccount } from "viem/accounts";
import { env } from "../env";

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
