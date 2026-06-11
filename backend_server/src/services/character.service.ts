import { CharacterRepository } from '../repositories/character.repository';
import { CharacterForgeInput } from '../validations/character.validation';

export class CharacterService {
  private characterRepo: CharacterRepository;

  constructor() {
    this.characterRepo = new CharacterRepository();
  }

  async forgeCharacter(userId: string, lobbyId: string, payload: CharacterForgeInput) {
    // 1. Business Rule: Ensure the user doesn't already have a character in this lobby
    const existingCharacter = await this.characterRepo.checkCharacterExists(userId, lobbyId);
    if (existingCharacter) {
      throw new Error("User already has a character in this lobby.");
    }

    // 2. Create the character (Cold State) securely
    const newCharacter = await this.characterRepo.createColdState(
      userId,
      lobbyId,
      payload.name,
      payload.description
    );

    return newCharacter;
  }
}