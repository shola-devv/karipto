import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Deposit from "@/lib/models/Deposit";
import { CHAINS, getChainById, getChainByKey } from "@/lib/chains";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chainParam = req.nextUrl.searchParams.get("chain") || "mainnet";
  const chain =
    getChainByKey(chainParam) ||
    getChainById(Number(chainParam)) ||
    CHAINS[0];

  await dbConnect();
  const user = await User.findById(id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const deposits = await Deposit.find({ userId: user._id })
    .sort({ blockNumber: -1 })
    .limit(50);

  const ethBalanceWei =
    user.balances.find((b) => b.chainId === chain.chainId && b.asset === "ETH")?.amount || "0";
  const usdtBalanceUnits =
    user.balances.find((b) => b.chainId === chain.chainId && b.asset === "USDT")?.amount || "0";

  return NextResponse.json({
    id: user._id,
    email: user.email,
    depositAddress: user.depositAddress,
    chainKey: chain.key,
    chainId: chain.chainId,
    chainName: chain.key === "mainnet" ? "Ethereum Mainnet" : "Sepolia Testnet",
    ethBalanceWei,
    usdtBalanceUnits,
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