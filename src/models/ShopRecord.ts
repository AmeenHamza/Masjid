import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const ShopRecordSchema = new Schema(
  {
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    note: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const ShopRecord = createModel('ShopRecord', ShopRecordSchema);
