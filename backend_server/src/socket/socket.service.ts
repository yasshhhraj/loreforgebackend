import type { Server } from 'socket.io';
import type express from 'express';
import { SocketRepository } from './socket.repository';
import { CharacterForgeSchema } from '../validations/character.validation';
import { CharacterService } from '../services/character.service';
import { turnSubmitSchema } from './socket.validation';

export class SocketService {
  private io: Server | undefined;
  private expressApp: express.Express | undefined;
  private socketRepository: SocketRepository;
  private characterService: CharacterService;

  constructor(io: Server, expressApp: express.Express) {
    this.io = io;
    this.expressApp = expressApp;
    this.socketRepository = new SocketRepository();
    this.characterService = new CharacterService();
  }

  getSocketMap(): Map<string, Set<string>> {
    if (!this.expressApp) return new Map();
    return this.expressApp.locals.socketMap || new Map<string, Set<string>>();
  }

  addUserSocket(userId: string, socketId: string): void {
    const map = this.getSocketMap();
    if (!map.has(userId)) {
      map.set(userId, new Set());
    }
    map.get(userId)?.add(socketId);
  }

  removeUserSocket(userId: string, socketId: string): void {
    const map = this.getSocketMap();
    const set = map.get(userId);
    if (set) {
      set.delete(socketId);
      if (set.size === 0) {
        map.delete(userId);
      }
    }
  }

  getLobbyMembers(lobbyRoom: string): string[] {
    if (!this.io) return [];

    const map = this.getSocketMap();
    const members: string[] = [];

    for (const [uid, set] of map.entries()) {
      for (const sid of set) {
        const socket = this.io.sockets.sockets.get(sid);
        if (socket?.rooms.has(lobbyRoom)) {
          members.push(uid);
          break;
        }
      }
    }
    return members;
  }

  async joinLobby(
    socketId: string,
    userId: string,
    lobbyId: string
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const lobbyRoom = `lobby-${lobbyId}`;
      const socket = this.io?.sockets.sockets.get(socketId);

      if (!socket) {  
        return { ok: false, error: 'Socket not found' };
      }

      socket.join(lobbyRoom);

      // Broadcast updated members list
      const members = this.getLobbyMembers(lobbyRoom);
      this.io?.to(lobbyRoom).emit('members-list-updated', { lobbyId, members });

      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async leaveLobby(socketId: string, userId: string, lobbyId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const lobbyRoom = `lobby-${lobbyId}`;
      const socket = this.io?.sockets.sockets.get(socketId);

      if (!socket) {
        return { ok: false, error: 'Socket not found' };
      }

      socket.leave(lobbyRoom);

      // Broadcast updated members list
      const members = this.getLobbyMembers(lobbyRoom);
      this.io?.to(lobbyRoom).emit('members-list-updated', { lobbyId, members });

      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }


  async forgeCharacter(
    userId: string,
    lobbyId: string,
    characterData: any
  ): Promise<{ ok: boolean; error?: string; character?: any }> {
    try {
      // Here you would typically create the character in the database
      // For demonstration, we'll just return the provided character data
      const character = CharacterForgeSchema.parse(characterData);
      
      const newCharacter = await this.characterService.forgeCharacter(userId, lobbyId, character);
      

      return { ok: true, character: newCharacter };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async getLobbyState(lobbyId: string): Promise<{ ok: boolean; lobby?: any; error?: string }> {
    try {
      const lobby = await this.socketRepository.getLobbyWithParticipants(lobbyId);

      if (!lobby) {
        return { ok: false, error: 'Lobby not found' };
      }

      return { ok: true, lobby };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async submitTurn(userId: string, lobbyId: string, turnData: any) {
    try {
      const validatedTurnData = turnSubmitSchema.parse({ lobbyId, turnData });

      const submitted = await this.socketRepository.submitTurn(validatedTurnData);

      // Here you would typically process the turn data and update the game state in the database
      // For demonstration, we'll just broadcast the turn data to all participants in the lobby

      const lobbyRoom = `lobby-${lobbyId}`;
      this.io?.to(lobbyRoom).emit('turn-submitted', { userId, turnData });

      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async sendMessage(
    userId: string,
    lobbyId: string,
    message: string
  ): Promise<{ ok: boolean; error?: string; msg?: any }> {
    try {
      const msg = {
        userId: userId || null,
        message,
        timestamp: new Date().toISOString(),
      };

      const lobbyRoom = `lobby-${lobbyId}`;
      this.io?.to(lobbyRoom).emit('chat-message', msg);

      return { ok: true, msg };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async handleDisconnect(userId: string, socketId: string): Promise<void> {
    this.removeUserSocket(userId, socketId);
  }
}
