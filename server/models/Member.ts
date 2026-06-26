import { Schema, model } from 'mongoose';

const memberSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String, required: true },
    joinedAt: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    passwordHash: { type: String }
  },
  { versionKey: false }
);

export const Member = model('Member', memberSchema);
