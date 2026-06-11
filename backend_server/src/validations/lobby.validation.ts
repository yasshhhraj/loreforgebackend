import { z } from 'zod';

// Validation for GET /:lobby_id
export const LobbyIdParamSchema = z.object({
  lobby_id: z.string().uuid({ message: "Invalid Lobby ID format." }),
});

// For POST /, the creation payload is currently empty as the DB handles defaults,
// but we export an empty schema to maintain the structural pattern.
export const LobbyCreateSchema = z.object({}).strict();