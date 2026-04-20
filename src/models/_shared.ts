import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const auditedFields = {
  addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: false },
};

export function createModel<T>(name: string, schema: Schema<T>) {
  return (mongoose.models[name] as mongoose.Model<T>) || mongoose.model<T>(name, schema);
}

export type WithId<T> = InferSchemaType<Schema<T>> & { _id: string };
