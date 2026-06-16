import type { Socket } from 'socket.io';
import { SocketRepository } from './socket.repository';

const socketRepository = new SocketRepository();

const LOBBY_EVENTS = [
  'join-lobby',
  'leave-lobby',
  'forge-character',
  'turn-submit',
  'lobby-state-request',
  'send-message'
];

export async function lobbyMiddleware(
  socket: Socket,
  event: any[],
  next: (err?: any) => void
) {
  const eventName = event[0];

  if (!LOBBY_EVENTS.includes(eventName)) {
    return next();
  }

  try {
    const payload = event[1];
    const lobbyId = payload?.lobbyId;
    const userId = socket.data.userId;

    if (!lobbyId) {
      return next(new Error('Lobby ID is required'));
    }

    if (!userId) {
      return next(new Error('User is not authenticated'));
    }

    const lobbyExists = await socketRepository.isLobbyActive(lobbyId);
    if (!lobbyExists) {
      return next(new Error('Lobby not found or inactive'));
    }

    const isUserInLobby = await socketRepository.isUserInLobby(userId, lobbyId);
    if (!isUserInLobby) {
      return next(new Error('User is not a participant in this lobby'));
    }

    return next();
  } catch (err) {
    return next(new Error('Internal server error during lobby validation'));
  }
}
