import 'dotenv/config';
import app from './app';
import { createServer } from 'http';
import { initializeSocketServer } from './socket/socket';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = createServer(app);

// Initialize Socket.IO server and attach to the running HTTP server
initializeSocketServer(server, app);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;
