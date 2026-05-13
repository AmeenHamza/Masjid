import { Schema } from 'mongoose';
import { createModel } from './_shared';

const MadrasaRecordSchema = new Schema(
  {
    title: { type: String, required: true },
    studentCount: { type: Number, required: true, min: 0 },
    teacherCount: { type: Number, required: true, min: 0 },
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

export const MadrasaRecord = createModel('MadrasaRecord', MadrasaRecordSchema);