import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const DonationSchema = new Schema(
  {
    donorName: { type: String, required: true },
    type: {
      type: String,
      enum: ['Friday', 'Box', 'Ramadan', 'Fitrah', 'General', 'Project'],
      required: true
    },
    date: { type: String },
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

export const Donation = createModel('Donation', DonationSchema);
