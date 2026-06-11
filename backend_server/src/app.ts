import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import characterRoutes from './routes/character.routes';
import lobbyRoutes from './routes/lobby.routes';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/character', characterRoutes);
app.use('/api/v1/lobby', lobbyRoutes); // Assuming lobby routes are handled in lobby.routes.ts



// Health endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use(errorHandler);

export default app;
