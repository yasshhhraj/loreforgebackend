import { turnQueue } from '../mq';
import type { Server } from 'socket.io';
import { randomUUID } from 'crypto';
import { GameMasterRepository } from '../repositories/gameMaster.repository';

export class GameMasterService {
  private io?: Server;
  private gameMasterRepository: GameMasterRepository;

  constructor() {
    this.gameMasterRepository = new GameMasterRepository();
    this.initializeConsumer();
  }

  public setSocketServer(io: Server) {
    this.io = io;
  }

  private initializeConsumer() {
    turnQueue.setConsumer(async (pendingTurnId: string) => {
      await this.processTurn(pendingTurnId);
    });
  }

  private async processTurn(pendingTurnId: string) {
    try {
      const pendingTurn = await this.gameMasterRepository.getPendingTurnWithLobby(pendingTurnId);

      if (!pendingTurn || !pendingTurn.lobby) {
        console.log(`Pending turn ${pendingTurnId} not found or has no associated lobby.`);
        return;
      }

      const { lobby, submitted } = pendingTurn;
      const newTurnNumber = lobby.turn_counter + 1;

      const coldState = await this.gameMasterRepository.getColdState(lobby.lobby_id);
      const worldBible = lobby.world_bible;
      const recentEvents = await this.gameMasterRepository.getRecentEvents(lobby.lobby_id);

      const { mutations, event_text } = processWithLLM({worldBible, coldState, recentEvents, submitted})

      const ledgerLogId = randomUUID();

      // Execute database operations atomically in a transaction via the repository
      const { eventRecord, updatedCharacters } = await this.gameMasterRepository.executeTurnTransaction(
        lobby.lobby_id,
        lobby.id,
        pendingTurn.id,
        newTurnNumber,
        submitted,
        mutations,
        event_text,
        ledgerLogId
      );

      console.log(`Successfully processed turn ${newTurnNumber} for lobby ${lobby.lobby_id}.`);

      // Notify clients via sockets
      if (this.io) {
        const lobbyRoom = `lobby-${lobby.lobby_id}`;
        this.io.to(lobbyRoom).emit('turn-processed', {
          turnNumber: newTurnNumber,
          event: eventRecord,
          coldState: updatedCharacters,
        });
      }

    } catch (err) {
      console.error(`Error processing turn ${pendingTurnId}:`, err);
    }
  }
}

// Export a singleton instance
export const gameMasterService = new GameMasterService();

function processWithLLM(data:any) {

  //llm api logic 
  // current mock
  const mutations = [{}]
  const event_text = "...."

  return {mutations, event_text}
}