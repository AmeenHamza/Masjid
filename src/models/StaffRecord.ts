import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

// 'Pending' means the admin has not manually marked this prayer yet.
// There is no automatic marking — 'Present' / 'Absent' only ever come
// from an explicit, manually-saved admin entry.
const attendanceStatusField = {
  type: String,
  enum: ['Present', 'Absent', 'Pending'],
  default: 'Pending'
};

const StaffRecordSchema = new Schema(
  {
    staffName: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ['Imam', 'Muazzin', 'Khadim'] },
    dateKey: { type: Date, required: true },
    fajrAttendance: attendanceStatusField,
    zoharAttendance: attendanceStatusField,
    asrAttendance: attendanceStatusField,
    maghribAttendance: attendanceStatusField,
    ishaAttendance: attendanceStatusField,
    note: { type: String },
    ...auditedFields
  },
  {
    timestamps: true,
    versionKey: false
  }
);

StaffRecordSchema.index({ staffName: 1, role: 1, dateKey: 1 });

export const StaffRecord = createModel('StaffRecord', StaffRecordSchema);
