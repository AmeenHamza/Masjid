import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const PrayerTimesSchema = new Schema(
  {
    dateKey: { type: String, required: true, unique: true, index: true },
    fajr: { type: String, required: true },
    zohar: { type: String, required: true },
    asr: { type: String, required: true },
    // Not admin-settable - always fetched live from the Aladhan API at
    // display time (see getTodayPrayerTimes). This stored value is only a
    // fallback for when that live fetch fails, so it must not be required:
    // the admin form always strips it before create/update (see
    // normalizePrayerTimesBody / normalizePrayerTimesPatchBody), which would
    // make the very first prayer-times record impossible to create if this
    // were required.
    maghrib: { type: String, default: '' },
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
