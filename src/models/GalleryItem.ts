import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const GalleryItemSchema = new Schema(
  {
    title: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    caption: { type: String },
    order: { type: Number, default: 0 },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const GalleryItem = createModel('GalleryItem', GalleryItemSchema);
