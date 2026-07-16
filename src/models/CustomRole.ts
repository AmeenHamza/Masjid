import { Schema } from 'mongoose';
import { createModel, auditedFields } from './_shared';

const CustomRoleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    ...auditedFields
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const CustomRole = createModel('CustomRole', CustomRoleSchema);
