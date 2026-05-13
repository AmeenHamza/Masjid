import { Schema } from 'mongoose';
import { createModel } from './_shared';

const MosqueBeddingSchema = new Schema(
  {
    itemName: { type: String, required: true },
    category: { type: String, required: true, enum: ['Bedding', 'Foundation', 'Expansion', 'Repairs', 'Other'] },
    quantity: { type: Number, required: true, min: 0 },
    note: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const MosqueBedding = createModel('MosqueBedding', MosqueBeddingSchema);