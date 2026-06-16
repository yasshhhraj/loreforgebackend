import { prisma } from '../../lib/prisma';
import { turnQueue } from '../mq';

export class SocketRepository {
  /**
   * Check if a user exists in the lobby's participants
   */
  async isUserInLobby(userId: string, lobbyId: string): Promise<boolean> {
    try {
      const lobby = await prisma.lobby.findUnique({
        where: { lobby_id: lobbyId },
      });

      if (!lobby) {
        return false;
      }

      return lobby.users.length > 0 && lobby.users.some((u) => u === userId);
    } catch (err) {
      console.error('Error checking user in lobby:', err);
      return false;
    }
  }

  /**
   * Get lobby with all participants
   */
  async getLobbyWithParticipants(lobbyId: string) {
    try {
      const lobby = await prisma.lobby.findUnique({
        where: { lobby_id: lobbyId },
        include: {
          characters: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      return lobby;
    } catch (err) {
      console.error('Error fetching lobby with participants:', err);
      return null;
    }
  }

  /**
   * Get lobby by ID with basic info
   */
  async getLobbyById(lobbyId: string) {
    try {
      const lobby = await prisma.lobby.findUnique({
        where: { lobby_id: lobbyId },
      });

      return lobby;
    } catch (err) {
      console.error('Error fetching lobby:', err);
      return null;
    }
  }

  /**
   * Get all user IDs in a specific lobby
   */
  async getLobbyParticipantIds(lobbyId: string): Promise<string[]> {
    try {
      const participants = await prisma.lobby.findUnique({
        where: { lobby_id: lobbyId },
        select: {
          users: true,
        },
      });

      if (!participants) {
        return [];
      }

      return participants.users;
    } catch (err) {
      console.error('Error fetching lobby participant IDs:', err);
      return [];
    }
  }

  /**
   * Verify if lobby exists and is active
   */
  async isLobbyActive(lobbyId: string): Promise<boolean> {
    try {
      const lobby = await prisma.lobby.findUnique({
        where: { lobby_id: lobbyId },
        select: { lobby_id: true },
      });

      return !!lobby;
    } catch (err) {
      console.error('Error verifying lobby active status:', err);
      return false;
    }
  }

  async submitTurn(data: any): Promise<boolean> {
    try {
      let pendingTurn = await prisma.pendingTurn.findUnique({
        where: {
          lobby_id: data.lobbyId
        }
      });

      //todo: finish logic if its first turn submission create a pending turn entry with the lobby id and push the new submission
      if (!pendingTurn) {
        await prisma.pendingTurn.create({
          data: {
            lobby_id: data.lobbyId,
            submitted: [data.turnData],
            submittedcount: 1,
          },
        });
        return true;
      }
      else {
        await prisma.pendingTurn.update({
            where: { lobby_id: data.lobbyId },
            data: {
            submitted: {
                push: data.turnData,
            },
            submittedcount: {
                increment: 1,
            }
            },
        });
      }
      
      pendingTurn = await prisma.pendingTurn.findUnique({
        where: {
            lobby_id: data.lobbyId
        },
      });

      const lobby = await prisma.lobby.findUnique({
        where: { lobby_id: data.lobbyId },
      });
      if (lobby && pendingTurn &&
        pendingTurn.submitted.length === lobby.users.length ) {
        // All turns submitted, process them
        turnQueue.enqueue(pendingTurn.id);
      }
      
      return true;
    } catch (err) {
      console.error('Error submitting turn:', err);
      return false;
    }
  }
}
