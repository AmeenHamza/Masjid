import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const PrayerTimesSchema = new Schema(
  {
    dateKey: { type: String, required: true, unique: true, index: true },
    fajr: { type: String, required: true },
    zohar: { type: String, required: true },
    asr: { type: String, required: true },
    maghrib: { type: String, required: true },
    isha: { type: String, required: true },
    juma: { type: String, required: false },
    notes: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const PrayerTimes = createModel('PrayerTimes', PrayerTimesSchema);
