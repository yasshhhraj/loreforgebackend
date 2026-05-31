import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('authorization') || req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    return res.status(401).json({ error: 'Invalid Authorization format' });
  }

  const token = parts[1];
  if (token !== 'dev-token') {
    return res.status(403).json({ error: 'Invalid token' });
  }

  (req as any).user = { id: 'dev', role: 'developer' };
  next();
}
