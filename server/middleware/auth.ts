import type { Request, Response, NextFunction } from 'express';
import { Member } from '../models/Member.js';

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Not authenticated. Please log in.' });
    return;
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Not authenticated. Please log in.' });
    return;
  }
  const member = await Member.findOne({ id: req.session.userId }).lean();
  if (!member || member.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  next();
}

export function getSessionUserId(req: Request): string | undefined {
  return req.session.userId;
}
