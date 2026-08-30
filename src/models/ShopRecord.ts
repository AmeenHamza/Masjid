import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const ShopRecordSchema = new Schema(
  {
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    contactNumber: { type: String },
    buyDate: { type: Date, required: true },
    date: { type: String },
    buyRate: { type: Number, min: 0, default: 0 },
    debtAmount: { type: Number, min: 0, default: 0 },
    monthlyRent: { type: Number, required: true, min: 0 },
    monthsDue: { type: Number, min: 0, default: 6 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    paymentStatus: { type: String, required: true, enum: ['Clear', 'Due', 'Partial'] },
    paymentAmount: { type: Number, default: 0, min: 0 },
    previousBalance: { type: Number, min: 0, default: 0 },
    serialNumber: { type: String, unique: true, sparse: true, index: true },
    rentHistory: { type: Map, of: Schema.Types.Mixed, default: {} },
    vacated: { type: Boolean, default: false },
    note: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const ShopRecord = createModel('ShopRecord', ShopRecordSchema);
