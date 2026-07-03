import { NextRequest, NextResponse } from "next/server";
import { performWithdrawal, WithdrawalError } from "@/lib/wallet/withdraw";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { userId, asset, amount, toAddress, chainId } = body || {};

  if (!userId || !["ETH", "USDT"].includes(asset)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let amountBig: bigint;
  try {
    amountBig = BigInt(amount);
  } catch {
    return NextResponse.json(
      { error: "amount must be a positive integer string (smallest unit)" },
      { status: 400 }
    );
  }

  try {
    const cid = typeof chainId === "number" ? chainId : Number(chainId) || 1;
    const result = await performWithdrawal({ userId, chainId: cid, asset, amount: amountBig, toAddress });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof WithdrawalError) {
      const status = err.code === "insufficient_balance" || err.code === "invalid_amount" || err.code === "invalid_address" ? 400 : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error("[withdraw] unexpected error", err);
    return NextResponse.json({ error: "Withdrawal failed" }, { status: 500 });
  }
}
