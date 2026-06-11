import { z } from 'zod';

// Validation for POST /:lobby_id/join
export const CharacterForgeSchema = z.object({
  name: z.string().min(2).max(50, { message: "Name must be between 2 and 50 characters." }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }),
  // Notice we explicitly DO NOT include health, inventory, or capabilities here.
});

export type CharacterForgeInput = z.infer<typeof CharacterForgeSchema>;
