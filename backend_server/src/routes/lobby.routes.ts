import { Router } from "express";
import { LobbyController } from "../controllers/lobby.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
const router = Router();
const lobbyController = new LobbyController();

// Implicit Whitelisting: Ensure every incoming request has a verified 
// sessionToken attached to a physical User before it hits the Controller[cite: 8, 43].
router.use(authMiddleware); // Assuming this middleware exists and is properly implemented

// 1. The Lobby Genesis
router.post('/', lobbyController.createLobby);

// 2. The Character Forger
router.post('/:lobby_id/join', lobbyController.joinLobby);

// 3. Lobby State Read (The Knock / Waiting Room)
router.get('/:lobby_id', lobbyController.getLobby);

export default router;
