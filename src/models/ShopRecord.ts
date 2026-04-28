import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const ShopRecordSchema = new Schema(
  {
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    contactNumber: { type: String },
    buyDate: { type: Date, required: true },
    buyRate: { type: Number, required: true, min: 0 },
    debtAmount: { type: Number, required: true, min: 0 },
    monthlyRent: { type: Number, required: true, min: 0 },
    monthsDue: { type: Number, required: true, min: 0, default: 6 },
    paymentStatus: { type: String, required: true, enum: ['Clear', 'Due', 'Partial'] },
    note: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const ShopRecord = createModel('ShopRecord', ShopRecordSchema);
