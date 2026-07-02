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
};

const STORAGE_KEY = "wallet_user_id";

export default function Home() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setUserId(stored);
  }, []);

  const fetchUser = useCallback(async (id: string) => {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setUser(data);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchUser(userId);
    const interval = setInterval(() => fetchUser(userId), 8000);
    return () => clearInterval(interval);
  }, [userId, fetchUser]);

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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      localStorage.setItem(STORAGE_KEY, data.id);
      setUserId(data.id);
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

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-sm bg-accent" />
          <span className="font-display text-lg font-semibold tracking-tight">Ledger</span>
        </div>
        {user && (
          <button onClick={signOut} className="text-xs text-muted hover:text-text">
            {user.email} · sign out
          </button>
        )}
      </header>

      {!userId || !user ? (
        <div className="rounded-lg border border-line bg-surface p-8">
          <h1 className="font-display text-2xl font-semibold text-text">
            One address, per person, every deposit tracked.
          </h1>
          <p className="mt-2 text-sm text-muted">
            Enter an email to get a dedicated Ethereum address for ETH and USDT deposits.
          </p>
          <form onSubmit={createOrLoadUser} className="mt-6 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-sm border border-line bg-surface2 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-ink transition hover:bg-accentDim disabled:opacity-50"
            >
              {loading ? "Working…" : "Get address"}
            </button>
          </form>
          {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        </div>
      ) : (
        <div className="space-y-6">
          <BalanceCard ethBalanceWei={user.ethBalanceWei} usdtBalanceUnits={user.usdtBalanceUnits} />
          <DepositCard address={user.depositAddress} />
          <div>
            <h2 className="mb-3 text-xs uppercase tracking-wider text-muted">Deposit ledger</h2>
            <LedgerStrip deposits={user.deposits} />
          </div>
        </div>
      )}

      <footer className="mt-16 text-center text-[11px] text-muted">
        Balances update automatically once deposits reach 12 confirmations.
      </footer>
    </main>
  );
}
