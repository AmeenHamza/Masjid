import { Schema } from 'mongoose';
import { createModel } from './_shared';

const StaffRecordSchema = new Schema(
  {
    staffName: { type: String, required: true },
    role: { type: String, required: true, enum: ['Imam', 'Muazzin', 'Khadim'] },
    dateKey: { type: Date, required: true, default: Date.now },
    fajrAttendance: { type: String, required: true, enum: ['Present', 'Absent'] },
    zoharAttendance: { type: String, required: true, enum: ['Present', 'Absent'] },
    asrAttendance: { type: String, required: true, enum: ['Present', 'Absent'] },
    maghribAttendance: { type: String, required: true, enum: ['Present', 'Absent'] },
    ishaAttendance: { type: String, required: true, enum: ['Present', 'Absent'] },
    note: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const StaffRecord = createModel('StaffRecord', StaffRecordSchema);