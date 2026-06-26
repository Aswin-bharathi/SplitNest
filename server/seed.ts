import { Member } from './models/Member.js';
import { Group } from './models/Group.js';
import { hashPassword } from './lib/auth.js';
import { nameToUsername } from './lib/username.js';

const ADMIN_PASSWORD = 'AS2712@$';

async function ensureAdmin() {
  const admin = await Member.findOne({ role: 'admin' }).lean();
  if (admin) {
    if (!admin.username) {
      await Member.updateOne({ id: admin.id }, { $set: { username: 'admin' } });
    }
    if (!admin.passwordHash) {
      const passwordHash = await hashPassword(ADMIN_PASSWORD);
      await Member.updateOne({ id: admin.id }, { $set: { passwordHash } });
    }
    return admin.id;
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  const adminMember = {
    id: 'admin',
    username: 'admin',
    name: 'Admin',
    email: 'admin@splitnest.app',
    avatar: 'A',
    joinedAt: new Date().toISOString(),
    role: 'admin' as const,
    passwordHash
  };
  await Member.create(adminMember);
  console.log('Created admin account (username: admin)');
  return adminMember.id;
}

async function ensureDefaultGroup(adminId: string) {
  const existing = await Group.findOne().lean();
  if (existing) return;

  await Group.create({
    id: 'default-group',
    name: 'My Group',
    description: 'Shared expenses group.',
    members: [adminId],
    budgetLimit: 5000
  });
  console.log('Created default group.');
}

async function backfillUsernames() {
  const members = await Member.find({ username: { $exists: false } }).lean();
  for (const member of members) {
    if (member.role === 'admin') {
      await Member.updateOne({ id: member.id }, { $set: { username: 'admin' } });
    } else {
      const username = nameToUsername(member.name);
      if (username) {
        await Member.updateOne({ id: member.id }, { $set: { username } });
      }
    }
  }
}

export async function seedDatabase() {
  const adminId = await ensureAdmin();
  await ensureDefaultGroup(adminId);
  await backfillUsernames();
  console.log('Database ready.');
}
