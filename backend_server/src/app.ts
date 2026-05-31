import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middlewares/auth.middleware';
import userRoutes from './routes/user.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// Attach auth middleware
app.use(authMiddleware);

// Mount routes
app.use('/api/users', userRoutes);

// Health endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use(errorHandler);

export default app;
