import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

// Attendance is fully manual. Only Present / Absent are allowed.
// There is no Pending state and no automatic marking of any kind.
const attendanceStatusField = {
  type: String,
  enum: ['Present', 'Absent'],
  default: 'Absent'
};

const StaffRecordSchema = new Schema(
  {
    staffName: { type: String, required: true, trim: true },
    // Role is stored as a free string so that admin-created custom roles
    // (in addition to Imam / Muazzin / Khadim) are supported.
    role: { type: String, required: true, trim: true },
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
