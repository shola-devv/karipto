import mongoose, { Schema, models, model } from "mongoose";

interface IScanCursor {
  _id: string; // e.g. "eth-mainnet"
  lastScannedBlock: number;
}

const ScanCursorSchema = new Schema<IScanCursor>({
  _id: { type: String, required: true },
  lastScannedBlock: { type: Number, required: true },
});

export default models.ScanCursor || model<IScanCursor>("ScanCursor", ScanCursorSchema);
