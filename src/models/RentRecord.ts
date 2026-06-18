import { Schema } from 'mongoose';
import { createModel } from './_shared';

const RentRecordSchema = new Schema(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'ShopRecord', required: true },
    shopName: { type: String, required: true }, // Backup ke liye taake query aasan ho
    rentAmount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 }, // 1 = January, 12 = December
    year: { type: Number, required: true },
    receivedDate: { type: Date, required: true, default: Date.now },
    paymentStatus: { type: String, required: true, enum: ['Clear', 'Partial', 'Due'] },
    note: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const RentRecord = createModel('RentRecord', RentRecordSchema);