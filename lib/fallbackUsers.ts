import { deriveAddressForIndex } from "./wallet/hdWallet";

export interface FallbackUser {
  id: string;
  email: string;
  depositAddress: string;
  derivationIndex: number;
  balances: Array<{ chainId: number; asset: "ETH" | "USDT"; amount: string }>;
  createdAt: Date;
}

const fallbackUsersById = new Map<string, FallbackUser>();
const fallbackUsersByEmail = new Map<string, FallbackUser>();

function makeFallbackId(email: string) {
  return `local:${Buffer.from(email).toString("base64url")}`;
}

export function nextFallbackDerivationIndex(): number {
  const latest = Array.from(fallbackUsersById.values()).reduce(
    (max, user) => Math.max(max, user.derivationIndex),
    0
  );
  return latest + 1;
}

export function getFallbackUserByEmail(email: string) {
  return fallbackUsersByEmail.get(email.trim().toLowerCase()) ?? null;
}

export function getFallbackUserById(id: string) {
  return fallbackUsersById.get(id) ?? null;
}

export function createFallbackUser(email: string, derivationIndex: number): FallbackUser {
  const normalized = email.trim().toLowerCase();
  const existing = fallbackUsersByEmail.get(normalized);
  if (existing) return existing;

  const user: FallbackUser = {
    id: makeFallbackId(normalized),
    email: normalized,
    depositAddress: deriveAddressForIndex(derivationIndex).toLowerCase(),
    derivationIndex,
    balances: [],
    createdAt: new Date(),
  };

  fallbackUsersById.set(user.id, user);
  fallbackUsersByEmail.set(normalized, user);
  return user;
}
