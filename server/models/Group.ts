import { Schema, model } from 'mongoose';

const groupSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    members: { type: [String], default: [] },
    budgetLimit: { type: Number, default: 5000 }
  },
  { versionKey: false }
);

export const Group = model('Group', groupSchema);
