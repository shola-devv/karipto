import mongoose, { Schema, models, model } from "mongoose";

interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = models.Counter || model<ICounter>("Counter", CounterSchema);

/**
 * Atomically allocates the next HD derivation index. Using findOneAndUpdate
 * with $inc guarantees no two concurrent signups collide on the same index,
 * even across multiple server instances.
 *
 * Index 0 is reserved for the treasury/sweep wallet (see lib/wallet/treasury.ts)
 * and is never handed out to a user — the counter starts at 0 so the first
 * call returns 1.
 */
export async function nextDerivationIndex(): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { _id: "userDerivationIndex" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return doc.seq;
}

export default Counter;
