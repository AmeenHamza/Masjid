import { Schema } from 'mongoose';
import { createModel } from './_shared';

const MadrasaRecordSchema = new Schema(
  {
    studentName: { type: String, required: true },
    fatherName: { type: String, required: true },
    contactNumber: { type: String },
    admissionDate: { type: String },
    darja: { type: String },
    class: { type: String },
    teacherName: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const MadrasaRecord = createModel('MadrasaRecord', MadrasaRecordSchema);