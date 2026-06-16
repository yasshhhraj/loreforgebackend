import {z} from 'zod';

export const turnSubmitSchema = z.object({
    lobbyId: z.string(),
    turnData: z.object({
        turn_id: z.string(),
        public_action: z.string(),
        secret_intent: z.string(),
    }),
});