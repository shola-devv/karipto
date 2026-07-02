import mongoose, { Schema, models, model } from "mongoose";

export interface IDeposit {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  asset: "ETH" | "USDT";
  txHash: string;
  logIndex?: number; // present for ERC20 Transfer events, absent for native ETH
  blockNumber: number;
  amount: string; // smallest unit (wei for ETH, 6-decimals for USDT)
  fromAddress: string;
  toAddress: string;
  confirmations: number;
  status: "pending" | "confirmed" | "credited";
  detectedAt: Date;
  creditedAt?: Date;
}

const DepositSchema = new Schema<IDeposit>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  asset: { type: String, enum: ["ETH", "USDT"], required: true },
  txHash: { type: String, required: true, lowercase: true },
  logIndex: { type: Number },
  blockNumber: { type: Number, required: true },
  amount: { type: String, required: true },
  fromAddress: { type: String, required: true, lowercase: true },
  toAddress: { type: String, required: true, lowercase: true },
  confirmations: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "confirmed", "credited"], default: "pending" },
  detectedAt: { type: Date, default: Date.now },
  creditedAt: { type: Date },
});

// A given (txHash, logIndex, asset) can only ever be recorded once.
// This is what makes deposit crediting idempotent / safe to re-scan.
DepositSchema.index({ txHash: 1, asset: 1, logIndex: 1 }, { unique: true });

export default models.Deposit || model<IDeposit>("Deposit", DepositSchema);
