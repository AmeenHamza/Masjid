import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const IncomeRecordSchema = new Schema(
  {
    title: { type: String, required: true },
    source: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    note: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const IncomeRecord = createModel('IncomeRecord', IncomeRecordSchema);
