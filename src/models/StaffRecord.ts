import mongoose, { Schema, Document } from 'mongoose';

export interface IStaffRecord extends Document {
  name: string;
  role: string;
  attendance: {
    date: string; // YYYY-MM-DD
    prayers: {
      fajr: boolean;
      dhuhr: boolean;
      asr: boolean;
      maghrib: boolean;
      isha: boolean;
    };
    isAbsent: boolean;
  }[];
  createdAt: Date;
}

const StaffRecordSchema: Schema = new Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  attendance: [{
    date: { type: String, required: true },
    prayers: {
      fajr: { type: Boolean, default: false },
      dhuhr: { type: Boolean, default: false },
      asr: { type: Boolean, default: false },
      maghrib: { type: Boolean, default: false },
      isha: { type: Boolean, default: false },
    },
    isAbsent: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.StaffRecord || mongoose.model<IStaffRecord>('StaffRecord', StaffRecordSchema);