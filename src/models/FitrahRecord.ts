import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const FitrahRecordSchema = new Schema(
  {
    familyName: { type: String, required: true },
    membersCount: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    year: { type: Number, required: true },
    note: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const FitrahRecord = createModel('FitrahRecord', FitrahRecordSchema);
