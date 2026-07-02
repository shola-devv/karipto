import { formatEther, formatUnits } from "viem";

function fmt(n: number, maxDecimals = 4) {
  return n.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
}

export default function BalanceCard({
  ethBalanceWei,
  usdtBalanceUnits,
}: {
  ethBalanceWei: string;
  usdtBalanceUnits: string;
}) {
  const eth = Number(formatEther(BigInt(ethBalanceWei || "0")));
  const usdt = Number(formatUnits(BigInt(usdtBalanceUnits || "0"), 6));

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted">Ethereum</span>
          <span className="h-2 w-2 rounded-full bg-accent" />
        </div>
        <div className="mt-3 font-mono text-2xl text-text">{fmt(eth, 6)}</div>
        <div className="mt-1 text-xs text-muted">ETH available</div>
      </div>
      <div className="rounded-lg border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted">Tether</span>
          <span className="h-2 w-2 rounded-full bg-accent" />
        </div>
        <div className="mt-3 font-mono text-2xl text-text">{fmt(usdt, 2)}</div>
        <div className="mt-1 text-xs text-muted">USDT available</div>
      </div>
    </div>
  );
}
