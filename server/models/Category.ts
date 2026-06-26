import { Schema, model } from 'mongoose';

const categorySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ['expense', 'income'], default: 'expense' }
  },
  { versionKey: false }
);

export const Category = model('Category', categorySchema);
