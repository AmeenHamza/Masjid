import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const MasjidSettingsSchema = new Schema(
  {
    masjidName: { type: String, required: true },
    madrasaName: { type: String },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    notice: { type: String },
    prayerMarquee: { type: String },
    logoUrl: { type: String },
    heroHeading: { type: String },
    heroSubheading: { type: String },
    paperSize: { type: String, enum: ['A4', 'Letter', 'Legal', 'A5', 'Custom'], default: 'A4' },
    paperWidth: { type: Number },
    paperHeight: { type: Number },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const MasjidSettings = createModel('MasjidSettings', MasjidSettingsSchema);
