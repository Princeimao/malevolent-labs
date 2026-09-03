import express from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'malevolent-agora-interview-secret-key';

export interface TokenUser {
  id: number;
  email: string;
  name: string;
}

export const requireAuth: express.RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No authorization token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as TokenUser;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token' });
  }
};

export function getTokenUser(req: express.Request): TokenUser {
  return (req as any).user as TokenUser;
}
