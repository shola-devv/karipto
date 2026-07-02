import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Deposit from "@/lib/models/Deposit";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const user = await User.findById(params.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const deposits = await Deposit.find({ userId: user._id })
    .sort({ blockNumber: -1 })
    .limit(50);

  return NextResponse.json({
    id: user._id,
    email: user.email,
    depositAddress: user.depositAddress,
    ethBalanceWei: user.ethBalanceWei,
    usdtBalanceUnits: user.usdtBalanceUnits,
    deposits: deposits.map((d) => ({
      asset: d.asset,
      txHash: d.txHash,
      amount: d.amount,
      status: d.status,
      confirmations: d.confirmations,
      blockNumber: d.blockNumber,
      detectedAt: d.detectedAt,
      creditedAt: d.creditedAt,
    })),
  });
}
