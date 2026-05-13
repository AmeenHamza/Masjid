import { Schema } from 'mongoose';
import { createModel } from './_shared';

const StaffRecordSchema = new Schema(
  {
    staffName: { type: String, required: true },
    role: { type: String, required: true },
    attendance: { type: String },
    reportPeriod: { type: String, required: true, enum: ['Monthly', 'Yearly'] },
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    agreement: { type: String },
    violations: { type: String },
    note: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const StaffRecord = createModel('StaffRecord', StaffRecordSchema);