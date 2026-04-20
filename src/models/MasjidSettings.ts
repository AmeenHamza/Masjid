import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const MasjidSettingsSchema = new Schema(
  {
    masjidName: { type: String, required: true },
    madrasaName: { type: String },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    notice: { type: String },
    prayerMarquee: { type: String },
    logoUrl: { type: String },
    heroHeading: { type: String },
    heroSubheading: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const MasjidSettings = createModel('MasjidSettings', MasjidSettingsSchema);
