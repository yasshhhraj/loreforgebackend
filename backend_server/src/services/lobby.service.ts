import { LobbyRepository } from '../repositories/lobby.repository';

export class LobbyService {
  private lobbyRepo: LobbyRepository;

  constructor() {
    this.lobbyRepo = new LobbyRepository();
  }

  async initializeLobby() {
    // Business logic (e.g., rate limiting lobby creations) would go here
    const newLobby = await this.lobbyRepo.createLobby();
    return newLobby;
  }

  async fetchLobbyState(lobbyId: string) {
    const lobby = await this.lobbyRepo.getLobbyWithParticipants(lobbyId);
    
    if (!lobby) {
      throw new Error("Lobby not found or has been closed.");
    }
    
    return lobby;
  }
}