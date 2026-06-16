import { prisma } from '../../lib/prisma';
import { TurnMutationsSchema } from '../validations/character.validation';

export class GameMasterRepository {
  async getPendingTurnWithLobby(pendingTurnId: string) {
    return prisma.pendingTurn.findUnique({
      where: { id: pendingTurnId },
      include: { lobby: true },
    });
  }

  async getColdState(lobbyId: string) {
    return prisma.character.findMany({
      where: {
        lobby_id: lobbyId,
      },
    });
  }

  async getRecentEvents(lobbyId: string, limit = 10) {
    return prisma.eVENT.findMany({
      where: {
        lobby_id: lobbyId,
      },
      select: {
        text: true,
      },
      take: limit,
      orderBy: {
        turn_id: 'desc',
      },
    });
  }

  async executeTurnTransaction(
    lobbyId: string,
    lobbyObjectId: string,
    pendingTurnObjectId: string,
    newTurnNumber: number,
    submitted: any,
    mutations: any[],
    eventText: string,
    ledgerLogId: string
  ) {
    // Note: Zod validation of mutations should ideally happen *before* calling this method.
    // For now, we are directly mapping the loosely typed mutations.

    const characterUpdates = mutations.map((mutation: any) => {
      const { character_id, ...changes } = mutation;
      return prisma.character.update({
        where: { character_id },
        data: changes,
      });
    });

    const results = await prisma.$transaction([
      prisma.turnLedger.create({
        data: {
          log_id: ledgerLogId,
          lobby_id: lobbyId,
          turn_number: newTurnNumber,
          turn_data: submitted,
        },
      }),
      prisma.eVENT.create({
        data: {
          turn_id: ledgerLogId,
          text: eventText,
          lobby_id: lobbyId,
          turn_number: newTurnNumber,
        },
      }),
      prisma.lobby.update({
        where: { id: lobbyObjectId },
        data: {
          turn_counter: newTurnNumber,
        },
      }),
      prisma.pendingTurn.delete({
        where: { id: pendingTurnObjectId },
      }),
      ...characterUpdates,
    ]);

    // The results array matches the order of the operations.
    // [turnLedger, eventRecord, updatedLobby, deletedPendingTurn, ...updatedCharacters]
    return {
      turnLedger: results[0],
      eventRecord: results[1],
      updatedLobby: results[2],
      deletedPendingTurn: results[3],
      updatedCharacters: results.slice(4),
    };
  }
}
