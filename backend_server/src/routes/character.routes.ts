import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { CharacterController } from '../controllers/character.controller';

const router = Router();

// Implicit Whitelisting: Ensure every incoming request has a verified 
// sessionToken attached to a physical User before it hits the Controller[cite: 675].
router.use(authMiddleware);

// Character-specific routes can be added here.

const characterController = new CharacterController();



router.post('/', characterController.createCharacter);


export default router;
