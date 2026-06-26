import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Member } from '../models/Member.js';

const SECRET = process.env.SESSION_SECRET ?? 'splitnest-dev-secret-change-in-production';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Not authenticated. Please log in.' });
    return;
  }
  try {
    const payload = jwt.verify(token, SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Not authenticated. Please log in.' });
    return;
  }
  try {
    const payload = jwt.verify(token, SECRET) as { userId: string };
    req.userId = payload.userId;
    const member = await Member.findOne({ id: req.userId }).lean();
    if (!member || member.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required.' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

export function getSessionUserId(req: Request): string | undefined {
  return req.userId;
}