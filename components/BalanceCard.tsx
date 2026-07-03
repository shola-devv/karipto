import { formatEther, formatUnits } from "viem";
import Image from "next/image";

function fmt(n: number, maxDecimals = 4) {
  return n.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
}

export default function BalanceCard({
  ethBalanceWei,
  usdtBalanceUnits,
  networkName,
}: {
  ethBalanceWei: string;
  usdtBalanceUnits: string;
  networkName: string;
}) {
  const eth = Number(formatEther(BigInt(ethBalanceWei || "0")));
  const usdt = Number(formatUnits(BigInt(usdtBalanceUnits || "0"), 6));

  return  (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      {/* Header: network + live status, single source of truth for both */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            {networkName}
          </span>
        </div>
        <span className="font-mono text-[11px] text-muted">{assets.length} assets</span>
      </div>

      {/* Asset rows: stacked on mobile, side-by-side from sm up */}
      <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {assets.map((a) => (
          <div
            key={a.key}
            className="group flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-surface2 sm:px-5 sm:py-5"
          >
            <div className="flex items-center gap-3">
              <Image
                src={a.logo}
                alt={`${a.symbol} logo`}
                width={32}
                height={32}
                className="rounded-full ring-1 ring-line"
              />
              <div>
                <p className="text-sm font-medium text-text">{a.label}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted">{a.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg text-text sm:text-xl">{fmt(a.value, a.decimals)}</p>
              <p className="text-[11px] text-muted">available</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
