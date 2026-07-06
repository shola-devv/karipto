"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function DepositCard({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted">Your deposit address</span>
        <span className="rounded-sm bg-surface2 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">
          Ethereum address
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="shrink-0 rounded-md bg-white p-2">
          <QRCodeSVG value={address} size={92} />
        </div>
        <div className="min-w-0">
          <div className="break-all font-mono text-sm text-text">{address}</div>
          <button
            onClick={copy}
            className="mt-3 rounded-sm border border-line bg-surface2 px-3 py-1.5 text-xs text-text transition hover:border-accent hover:text-accent"
          >
            {copied ? "Copied" : "Copy address"}
          </button>
          <p className="mt-3 text-xs text-muted">
            Send ETH or USDT (ERC-20) here. 
            <span className="text-text"></span>.
          </p>
        </div>
      </div>
    </div>
  );
}
