import { z } from 'zod';

// Validation for POST /:lobby_id/join
export const CharacterForgeSchema = z.object({
  name: z.string().min(2).max(50, { message: "Name must be between 2 and 50 characters." }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }),
  // Notice we explicitly DO NOT include health, inventory, or capabilities here.
});

export type CharacterForgeInput = z.infer<typeof CharacterForgeSchema>;

// Validation for AI-generated state mutations (Repository Gatekeeping)
export const CharacterMutationSchema = z.object({
  character_id: z.string().uuid({ message: "Invalid character_id. Must be a valid UUID." }),
  health: z.number().int().min(0).max(1000).optional(),
  inventory: z.any().optional(),
  capabilities: z.any().optional(),
  bond_track: z.any().optional(),
  is_ghosted: z.boolean().optional(),
}).strict();

export const TurnMutationsSchema = z.array(CharacterMutationSchema);

export type CharacterMutationInput = z.infer<typeof CharacterMutationSchema>;

