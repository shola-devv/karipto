import mongoose, { Schema, models, model } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  derivationIndex: number;
  depositAddress: string; // lowercase 0x address, derived, not secret
  balances: { chainId: number; asset: "ETH" | "USDT"; amount: string }[]; // per-chain balances
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  derivationIndex: { type: Number, required: true, unique: true },
  depositAddress: { type: String, required: true, unique: true, index: true, lowercase: true },
  balances: {
    type: [
      {
        chainId: { type: Number, required: true, index: true },
        asset: { type: String, enum: ["ETH", "USDT"], required: true },
        amount: { type: String, default: "0" },
      },
    ],
    default: [],
  },
  createdAt: { type: Date, default: Date.now },
});

export default models.User || model<IUser>("User", UserSchema);
