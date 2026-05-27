import mongoose, { Document, Schema } from 'mongoose';

export interface ICounter extends Document {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const CounterModel = mongoose.model<ICounter>('Counter', CounterSchema);

/**
 * Atomically increments and returns the next sequence value for the given key.
 */
export async function getNextSequence(key: string): Promise<number> {
  const counter = await CounterModel.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return counter!.seq;
}

export default CounterModel;
