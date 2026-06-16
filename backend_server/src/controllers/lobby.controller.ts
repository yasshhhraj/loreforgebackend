import { Request, Response } from 'express';
import { LobbyService } from '../services/lobby.service';
import { LobbyCreateSchema, LobbyIdParamSchema } from '../validations/lobby.validation';

const lobbyService = new LobbyService();

export class LobbyController {
  
  // Creates the Warm State skeleton [cite: 5]
  async createLobby(req: Request, res: Response) {
    try {
      // Ensure no rogue data was passed in the body
      LobbyCreateSchema.parse(req.body);

      const lobby = await lobbyService.initializeLobby();

      res.status(201).json({
        message: "Lobby Genesis complete.",
        lobby_id: lobby.lobby_id
      });
    } catch (error: any) {
      console.log(error);
      
      res.status(400).json({ error: error.message });
    }
  }

  // Adds an authenticated user's character to a lobby [cite: 10]
  async joinLobby(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new Error('Unauthorized user');
      }

      const { lobby_id } = LobbyIdParamSchema.parse(req.params);

      // add code to validate lobby existence and capacity here if needed
      const lobby = await lobbyService.fetchLobbyState(lobby_id);
      if (!lobby) {
        throw new Error('Lobby not found');
      }

      await lobbyService.addParticipantToLobby(userId, lobby_id);
      res.status(200).json({
        message: "User successfully joined the lobby. Forge your character and prepare for the adventure!",
        lobby_id: lobby_id,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Fetches current lobby participants before the game begins [cite: 7]
  async getLobby(req: Request, res: Response) {
    try {
      // Validate the URL parameter
      const { lobby_id } = LobbyIdParamSchema.parse(req.params);

      const lobby = await lobbyService.fetchLobbyState(lobby_id);

      res.status(200).json({
        message: "Lobby data retrieved.",
        lobby
      });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}
