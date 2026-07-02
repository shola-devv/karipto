import { NextRequest, NextResponse } from "next/server";
import { runDepositScan } from "@/lib/wallet/deposits";
import { env } from "@/lib/env";

// Call this from a scheduler (cron job, Vercel Cron, a queue worker, etc.)
// on a tight interval (e.g. every 15-30s). It's safe to invoke concurrently.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!env.scannerCronSecret() || secret !== env.scannerCronSecret()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDepositScan();
    return NextResponse.json({
      ok: true,
      scannedFrom: result.scannedFrom.toString(),
      scannedTo: result.scannedTo.toString(),
      chainHead: result.latest.toString(),
    });
  } catch (err: any) {
    console.error("[deposit-scan] failed", err);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
