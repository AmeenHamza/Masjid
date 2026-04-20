import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Complete', 'Incomplete', 'Upcoming'], default: 'Incomplete' },
    targetAmount: { type: Number, default: 0 },
    collectedAmount: { type: Number, default: 0 },
    imageUrl: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Project = createModel('Project', ProjectSchema);
