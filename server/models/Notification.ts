import { Schema, model } from 'mongoose';

const notificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    groupId: { type: String, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    createdAt: { type: String, required: true },
    read: { type: Boolean, default: false }
  },
  { versionKey: false }
);

export const Notification = model('Notification', notificationSchema);
