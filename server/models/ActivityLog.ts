import { Schema, model } from 'mongoose';

const activityLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    groupId: { type: String, index: true },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    timestamp: { type: String, required: true }
  },
  { versionKey: false }
);

export const ActivityLog = model('ActivityLog', activityLogSchema);
