"use client";

import { useEffect, useState, useCallback } from "react";
import BalanceCard from "@/components/BalanceCard";
import DepositCard from "@/components/DepositCard";
import LedgerStrip from "@/components/LedgerStrip";

type UserData = {
  id: string;
  email: string;
  depositAddress: string;
  ethBalanceWei: string;
  usdtBalanceUnits: string;
  deposits: any[];
  chainKey: string;
  chainName: string;
};

const STORAGE_KEY = "wallet_user_id";
const CHAIN_OPTIONS = [
  { key: "mainnet", name: "Ethereum Mainnet", chainId: 1 },
  { key: "sepolia", name: "Sepolia Testnet", chainId: 11155111 },
];

async function readJsonSafely(res: Response) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedChain, setSelectedChain] = useState("mainnet");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setUserId(stored);
  }, []);

  const fetchUser = useCallback(async (id: string, chainKey: string) => {
    const res = await fetch(`/api/users/${id}?chain=${chainKey}`);
    if (!res.ok) return;

    const data = await readJsonSafely(res);
    if (data) setUser(data);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchUser(userId, selectedChain);
    const interval = setInterval(() => fetchUser(userId, selectedChain), 8000);
    return () => clearInterval(interval);
  }, [userId, selectedChain, fetchUser]);

  async function createOrLoadUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readJsonSafely(res);
      if (!res.ok) {
        throw new Error(data?.error || `Request failed with status ${res.status}`);
      }
      if (!data?.id) {
        throw new Error("Could not create or load your wallet");
      }
      localStorage.setItem(STORAGE_KEY, data.id);
      setUserId(data.id);
      await fetchUser(data.id, selectedChain);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY);
    setUserId(null);
    setUser(null);
  }

  const activeChainName = CHAIN_OPTIONS.find((chain) => chain.key === selectedChain)?.name || "Ethereum Mainnet";

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-sm bg-yellow-300" />
          <span className="font-display text-lg font-semibold tracking-tight">KARIPTO</span>
        </div>
        {user && (
          <div className="flex flex-col gap-2 text-right">
            <div className="text-sm text-muted">Signed in as</div>
            <div className="font-semibold text-text">{user.email}</div>
            <button onClick={signOut} className="text-xs text-muted hover:text-text">
              Sign out
            </button>
          </div>
        )}
      </header>

      {!userId || !user ? (
        <div className="rounded-lg border border-line bg-surface p-8">
          <h1 className="font-display text-2xl font-semibold text-text">
            One address, per AI agent, per person, access to ETH and USDT across EVM chains.
          </h1>
          <p className="mt-2 text-sm text-muted">
            Enter an email to get a dedicated Ethereum address for ETH and USDT deposits.
          </p>
          <form onSubmit={createOrLoadUser} className="mt-6 flex gap-2 flex-col sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="fable@example.com"
              className="flex-1 rounded-sm border border-line bg-surface2 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-md cursor-pointer bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-whiteDim disabled:opacity-50"
            >
              {loading ? "Working…" : "Get address"}
            </button>
          </form>
          {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Active network</p>
              <p className="text-lg font-semibold text-text">{activeChainName}</p>
            </div>
            <div className="flex gap-2">
              {CHAIN_OPTIONS.map((chain) => (
                <button
                  key={chain.key}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    selectedChain === chain.key
                      ? "bg-white text-black"
                      : "bg-surface2 text-muted hover:bg-surface"
                  }`}
                  onClick={() => setSelectedChain(chain.key)}
                >
                  {chain.name}
                </button>
              ))}
            </div>
          </div>

          <BalanceCard
            ethBalanceWei={user.ethBalanceWei}
            usdtBalanceUnits={user.usdtBalanceUnits}
            networkName={activeChainName}
          />

          <DepositCard address={user.depositAddress} />

          <div>
            <h2 className="mb-3 text-xs uppercase tracking-wider text-muted">Deposit ledger</h2>
            <LedgerStrip deposits={user.deposits} />
          </div>
        </div>
      )}

      <footer className="mt-16 text-center text-[16px] text-white">
        Karipto gives AI agents & humans crypto access.
      </footer>
    </main>
  );
}
