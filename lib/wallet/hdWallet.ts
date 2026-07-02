import { getAddress, isAddress } from "viem";
import { dbConnect } from "../mongodb";
import User from "../models/User";
import { sendEthFromTreasury, sendUsdtFromTreasury } from "./treasury";

export class WithdrawalError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export async function performWithdrawal(params: {
  userId: string;
  asset: "ETH" | "USDT";
  amount: bigint;
  toAddress: string;
}) {
  const { userId, asset, amount, toAddress } = params;

  if (!isAddress(toAddress)) {
    throw new WithdrawalError("Invalid destination address", "invalid_address");
  }
  if (amount <= 0n) {
    throw new WithdrawalError("Amount must be positive", "invalid_amount");
  }

  await dbConnect();
  const field = asset === "ETH" ? "ethBalanceWei" : "usdtBalanceUnits";
  const amountStr = amount.toString();

  // Pessimistically reserve funds first: atomic + numeric comparison via
  // $expr/$toDecimal (balances are stored as decimal strings, so a naive
  // string $gte would compare lexicographically and be wrong).
  const reserved = await User.findOneAndUpdate(
    {
      _id: userId,
      $expr: { $gte: [{ $toDecimal: `$${field}` }, { $toDecimal: amountStr }] },
    },
    [
      {
        $set: {
          [field]: {
            $toString: { $subtract: [{ $toDecimal: `$${field}` }, { $toDecimal: amountStr }] },
          },
        },
      },
    ]
  );

  if (!reserved) {
    throw new WithdrawalError("Insufficient balance", "insufficient_balance");
  }

  try {
    const to = getAddress(toAddress);
    const txHash =
      asset === "ETH" ? await sendEthFromTreasury(to, amount) : await sendUsdtFromTreasury(to, amount);
    return { txHash, asset, amount: amountStr, toAddress: to };
  } catch (err) {
    // Refund: the on-chain send failed after we'd already reserved the balance.
    await User.findOneAndUpdate({ _id: userId }, [
      {
        $set: {
          [field]: { $toString: { $add: [{ $toDecimal: `$${field}` }, { $toDecimal: amountStr }] } },
        },
      },
    ]);
    throw new WithdrawalError("On-chain send failed, balance refunded", "send_failed");
  }
}
