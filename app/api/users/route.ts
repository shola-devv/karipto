import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { nextDerivationIndex } from "@/lib/models/Counter";
import { deriveAddressForIndex } from "@/lib/wallet/hdWallet";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => null);
    const email = body?.email?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({
        id: existing._id,
        email: existing.email,
        depositAddress: existing.depositAddress,
      });
    }

    const index = await nextDerivationIndex();
    const address = deriveAddressForIndex(index).toLowerCase();

    const user = await User.create({
      email,
      derivationIndex: index,
      depositAddress: address,
    });

    return NextResponse.json(
      { id: user._id, email: user.email, depositAddress: user.depositAddress },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[users] create failed", error);
    return NextResponse.json(
      { error: error?.message || "Could not create or load your wallet" },
      { status: 500 }
    );
  }
}
