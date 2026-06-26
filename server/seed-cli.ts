import 'dotenv/config';
import { connectDb, disconnectDb } from './db.js';
import { resetDatabase } from './reset.js';
import { seedDatabase } from './seed.js';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/splitnest';

async function main() {
  const mode = process.argv[2] ?? 'seed';
  await connectDb(MONGODB_URI);
  if (mode === 'reset') {
    await resetDatabase();
  }
  await seedDatabase();
  await disconnectDb();
  console.log(mode === 'reset' ? 'Database reset and seeded.' : 'Seed complete.');
}

main().catch(async (error) => {
  console.error(error);
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
