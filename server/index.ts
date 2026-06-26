import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { connectDb } from './db.js';
import { seedDatabase } from './seed.js';
import { apiRouter } from './routes/api.js';
import { authRouter } from './routes/auth.js';

const PORT = Number(process.env.PORT ?? 3001);
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/splitnest';
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'splitnest-dev-secret-change-in-production';
const SESSION_MAX_AGE_MS = Number(process.env.SESSION_MAX_AGE_MS ?? 7 * 24 * 60 * 60 * 1000); // 7 days

async function start() {
  await connectDb(MONGODB_URI);

  if (process.env.NODE_ENV !== "production") {
    await seedDatabase();
  }

  const app = express();
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: MONGODB_URI, ttl: SESSION_MAX_AGE_MS / 1000 }),
      cookie: {
        maxAge: SESSION_MAX_AGE_MS,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      }
    })
  );

  app.use('/api/auth', authRouter);
  app.use('/api', apiRouter);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SplitNest API running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
