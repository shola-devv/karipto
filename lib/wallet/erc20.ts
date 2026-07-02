import mongoose, { Schema, models, model } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  derivationIndex: number;
  depositAddress: string; // lowercase 0x address, derived, not secret
  ethBalanceWei: string; // credited balance, string to avoid precision loss
  usdtBalanceUnits: string; // smallest USDT unit (6 decimals), as string
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  derivationIndex: { type: Number, required: true, unique: true },
  depositAddress: { type: String, required: true, unique: true, index: true, lowercase: true },
  ethBalanceWei: { type: String, default: "0" },
  usdtBalanceUnits: { type: String, default: "0" },
  createdAt: { type: Date, default: Date.now },
});

export default models.User || model<IUser>("User", UserSchema);
