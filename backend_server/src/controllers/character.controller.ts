import { Request, Response } from "express";
import { CharacterService } from "../services/character.service";
import { CharacterForgeSchema } from "../validations/character.validation";
import { LobbyIdParamSchema } from "../validations/lobby.validation";

const characterService = new CharacterService();

export class CharacterController {

    async createCharacter(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                throw new Error('Unauthorized user');
            }

            const { lobby_id } = LobbyIdParamSchema.parse(req.params);

            const validatedData = CharacterForgeSchema.parse(req.body);

            const character = await characterService.forgeCharacter(
                userId,
                lobby_id,
                validatedData
            );

            res.status(201).json({
                message: 'Character created successfully',
                character
            });
        }
        catch (error: any) {
            console.log(error);
            res.status(400).json({ error: error.message });
        }
    }
}