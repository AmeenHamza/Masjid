import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const auditedFields = {
  addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: false },
};

export function createModel<T>(name: string, schema: Schema<T>) {
  // In dev, schema definitions can change during HMR. Recreate the model
  // so Mongoose doesn't keep validating against a stale schema instance.
  if (process.env.NODE_ENV !== 'production' && mongoose.models[name]) {
    delete mongoose.models[name];
  }

  return (mongoose.models[name] as mongoose.Model<T>) || mongoose.model<T>(name, schema);
}

export type WithId<T> = InferSchemaType<Schema<T>> & { _id: string };
