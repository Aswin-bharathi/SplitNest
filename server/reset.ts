import { Member } from './models/Member.js';
import { Group } from './models/Group.js';
import { Expense } from './models/Expense.js';
import { ActivityLog } from './models/ActivityLog.js';
import { Notification } from './models/Notification.js';
import { Category } from './models/Category.js';
import { SettlementRecord } from './models/SettlementRecord.js';

const COLLECTIONS = [Member, Group, Expense, ActivityLog, Notification, Category, SettlementRecord];

export async function resetDatabase() {
  for (const model of COLLECTIONS) {
    await model.collection.drop().catch(() => undefined);
  }
  console.log('All SplitNest collections dropped.');
}
