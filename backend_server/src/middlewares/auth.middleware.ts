import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // console.log(req.cookies);
    
    const session_token = req.cookies['session_token'];
    if(!session_token) {
      return res.status(401).json({ error: 'Missing session token' });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken: session_token },
      include: { user: true },
    });

    if (!session) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    if (session.expires && session.expires <= new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }
    
    (req as any).user = { id: session.user.id };
    next();
  } catch (err) {
    next(err);
  }
}
