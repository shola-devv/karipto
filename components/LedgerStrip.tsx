import { formatEther, formatUnits } from "viem";

type Deposit = {
  asset: "ETH" | "USDT";
  txHash: string;
  amount: string;
  status: "pending" | "confirmed" | "credited";
  confirmations: number;
  blockNumber: number;
  detectedAt: string;
};

const REQUIRED = 12;

function amountLabel(d: Deposit) {
  const value =
    d.asset === "ETH"
      ? formatEther(BigInt(d.amount))
      : formatUnits(BigInt(d.amount), 6);
  return `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 6 })} ${d.asset}`;
}

function ConfirmationTicks({ confirmations, status }: { confirmations: number; status: string }) {
  const filled = Math.min(confirmations, REQUIRED);
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: REQUIRED }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 w-1 rounded-[1px] ${
            i < filled
              ? status === "credited"
                ? "bg-accent"
                : "bg-warn"
              : "bg-line"
          }`}
        />
      ))}
    </div>
  );
}

export default function LedgerStrip({ deposits }: { deposits: Deposit[] }) {
  if (deposits.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-surface/50 p-8 text-center">
        <p className="font-mono text-sm text-muted">no entries yet</p>
        <p className="mt-1 text-xs text-muted">
          Deposits appear here the moment they're seen on-chain.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-6 border-b border-line px-5 py-2 text-[10px] uppercase tracking-wider text-muted">
        <span>Status</span>
        <span>Tx</span>
        <span>Amount</span>
        <span>Confirmations</span>
      </div>
      <div className="divide-y divide-line">
        {deposits.map((d) => (
          <div
            key={d.txHash + d.asset}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-6 px-5 py-3"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                d.status === "credited"
                  ? "bg-accent"
                  : "bg-warn pulse-dot"
              }`}
            />
            <span className="truncate font-mono text-xs text-muted">
              {d.txHash.slice(0, 10)}…{d.txHash.slice(-6)}
            </span>
            <span className="font-mono text-sm text-text">{amountLabel(d)}</span>
            <ConfirmationTicks confirmations={d.confirmations} status={d.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
