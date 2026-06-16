import { prisma } from '../../lib/prisma';
import type { Socket } from 'socket.io';

function parseCookies(cookieHeader: string | undefined) {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  const pairs = cookieHeader.split(';');
  for (const p of pairs) {
    const idx = p.indexOf('=');
    if (idx < 0) continue;
    const key = p.slice(0, idx).trim();
    const val = decodeURIComponent(p.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

export async function socketAuth(socket: Socket, next: (err?: any) => void) {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const session_token = cookies['session_token'];
    if (!session_token) return next(new Error('Missing session token'));

    const session = await prisma.session.findUnique({
      where: { sessionToken: session_token },
      include: { user: true },
    });

    if (!session) return next(new Error('Invalid session'));
    if (session.expires && session.expires <= new Date()) return next(new Error('Session expired'));

    socket.data.userId = session.user.id;
    return next();
  } catch (err) {
    return next(err);
  }
}
