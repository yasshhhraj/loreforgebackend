import { prisma } from "../../lib/prisma";

export class CharacterRepository {
  async createColdState(userId: string, lobbyId: string, name: string, description: string) {
    return await prisma.character.create({
      data: {
        userId,
        lobby_id: lobbyId,
        name,
        description,
        // The Ground Truth defaults applied securely at the DB level
        health: 100, // Hardcoded starting health [cite: 801]
        inventory: [], // Initialized as an empty JSON array [cite: 801]
        capabilities: [], // Initialized as an empty JSON array [cite: 801]
        bond_track: [], // Initialized as an empty JSON array [cite: 801]
        is_ghosted: false // Fault tolerance default [cite: 802]
      }
    });
  }

  async checkCharacterExists(userId: string, lobbyId: string) {
    return await prisma.character.findFirst({
      where: { userId, lobby_id: lobbyId }
    });
  }
}