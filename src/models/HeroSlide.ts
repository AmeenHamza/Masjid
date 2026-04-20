import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const HeroSlideSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const HeroSlide = createModel('HeroSlide', HeroSlideSchema);
