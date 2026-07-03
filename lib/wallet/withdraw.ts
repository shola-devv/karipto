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
  chainId: number;
  asset: "ETH" | "USDT";
  amount: bigint;
  toAddress: string;
}) {
  const { userId, asset, amount, toAddress } = params;
  const chainId = (params as any).chainId || 1;

  if (!isAddress(toAddress)) {
    throw new WithdrawalError("Invalid destination address", "invalid_address");
  }
  if (amount <= 0n) {
    throw new WithdrawalError("Amount must be positive", "invalid_amount");
  }

  await dbConnect();
  const amountStr = amount.toString();

  // Reserve funds in the balances array for the requested chain/asset.
  const reserved = await User.findOneAndUpdate(
    {
      _id: userId,
      balances: { $elemMatch: { chainId, asset, amount: { $gte: amountStr } } },
    },
    [
      {
        $set: {
          balances: {
            $map: {
              input: "$balances",
              as: "b",
              in: {
                $cond: [
                  { $and: [{ $eq: ["$$b.chainId", chainId] }, { $eq: ["$$b.asset", asset] }] },
                  { $mergeObjects: ["$$b", { amount: { $toString: { $subtract: [{ $toDecimal: "$$b.amount" }, { $toDecimal: amountStr }] } } }] },
                  "$$b",
                ],
              },
            },
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
      asset === "ETH" ? await sendEthFromTreasury(chainId, to, amount) : await sendUsdtFromTreasury(chainId, to, amount);
    return { txHash, asset, amount: amountStr, toAddress: to };
  } catch (err) {
    // Refund: the on-chain send failed after we'd already reserved the balance.
    await User.findOneAndUpdate({ _id: userId }, [
      {
        $set: {
          balances: {
            $map: {
              input: "$balances",
              as: "b",
              in: {
                $cond: [
                  { $and: [{ $eq: ["$$b.chainId", chainId] }, { $eq: ["$$b.asset", asset] }] },
                  { $mergeObjects: [
                    "$$b",
                    { amount: { $toString: { $add: [{ $toDecimal: "$$b.amount" }, { $toDecimal: amountStr }] } } },
                  ] },
                  "$$b",
                ],
              },
            },
          },
        },
      },
    ]);
    throw new WithdrawalError("On-chain send failed, balance refunded", "send_failed");
  }
}
