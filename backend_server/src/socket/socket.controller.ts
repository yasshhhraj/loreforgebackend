import type { Socket, Server, DefaultEventsMap } from 'socket.io';
import type express from 'express';
import { SocketService } from './socket.service';
import { lobbyMiddleware } from './lobby.middleware';

export class SocketController {
  private socketService: SocketService;

  constructor(io: Server, expressApp: express.Express) {
    this.socketService = new SocketService(io, expressApp);
  }

  handleConnection(socket: Socket): void {
    const userId = socket.data.userId as string | undefined;

    if (userId) {
      this.socketService.addUserSocket(userId, socket.id);
    }

    // Apply lobby validation middleware
    socket.use((event, next) => lobbyMiddleware(socket, event, next));

    // Catch middleware errors to maintain consistent error format
    socket.on('error', (err) => {
      // socket.io auto-emits 'error' event on next(err) but passes the Error object
      // If we want we could handle it here, but it's handled by socket.io natively.
    });

    // Register event listeners
    socket.on('join-lobby', (payload) => this.handleJoinLobby(socket, payload));
    socket.on('leave-lobby', (payload) => this.handleLeaveLobby(socket, payload));
    socket.on('forge-character', (payload) => this.handleForgeCharacter(socket, payload));
    socket.on('turn-submit', (payload) => this.handleTurnSubmit(socket, payload));
    socket.on('lobby-state-request', (payload, cb) => this.handleLobbyStateRequest(payload, cb));
    socket.on('send-message', (payload) => this.handleSendMessage(socket, payload));
    socket.on('disconnect', () => this.handleDisconnect(socket, userId));
  }
  
  
  private async handleTurnSubmit(socket: Socket, payload: {lobbyId: string, turnData: {turn_id:string, public_action: string, secret_intent: string}}): Promise<void> {
    const result = await this.socketService.submitTurn(socket.data.userId as string, payload.lobbyId, payload.turnData);
    if (!result.ok) {
      socket.emit('error', { message: result.error });
    }
  }

  private async handleJoinLobby(socket: Socket, payload: { lobbyId: string }): Promise<void> {
    const userId = socket.data.userId as string;

    const result = await this.socketService.joinLobby(socket.id, userId, payload.lobbyId);
    if (!result.ok) {
      socket.emit('error', { message: result.error });
    }
  }

  private async handleLeaveLobby(socket: Socket, payload: { lobbyId: string }): Promise<void> {
    const userId = socket.data.userId as string;

    const result = await this.socketService.leaveLobby(socket.id, userId, payload.lobbyId);
    if (!result.ok) {
      socket.emit('error', { message: result.error });
    }
  }

  private async handleLobbyStateRequest(
    payload: { lobbyId: string },
    cb: (data: any) => void
  ): Promise<void> {
    const result = await this.socketService.getLobbyState(payload.lobbyId);
    if (typeof cb === 'function') {
      cb({ ok: result.ok, lobby: result.lobby, error: result.error });
    }
  }

  private async handleSendMessage(
    socket: Socket,
    payload: { lobbyId: string; message: string }
  ): Promise<void> {
    const userId = socket.data.userId as string;
    const result = await this.socketService.sendMessage(userId, payload.lobbyId, payload.message);
    if (!result.ok) {
      socket.emit('error', { message: result.error });
    }
  }

  private async handleDisconnect(socket: Socket, userId: string | undefined): Promise<void> {
    if (userId) {
      await this.socketService.handleDisconnect(userId, socket.id);
    }
  }

  private async handleForgeCharacter(
    socket: Socket,
    payload: { lobbyId: string; characterData: any }
  ): Promise<void> {
    const userId = socket.data.userId as string;
    const result = await this.socketService.forgeCharacter(userId, payload.lobbyId, payload.characterData);
    if (!result.ok) {
      socket.emit('error', { message: result.error });
    }
  }
}
