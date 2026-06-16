import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type express from 'express';
import { socketAuth } from './auth';
import { SocketController } from './socket.controller';
import { gameMasterService } from '../services/gameMaster.service';

let io: Server;
let expressApp: express.Express | undefined;

export function initializeSocketServer(httpServer: HTTPServer, app: express.Express) {
  expressApp = app;
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  // Initialize socket map on app.locals
  if (expressApp) {
    expressApp.locals.socketMap = expressApp.locals.socketMap || new Map<string, Set<string>>();
    expressApp.set('io', io);
  }

  // Set the socket server on the GameMasterService
  gameMasterService.setSocketServer(io);

  // Auth middleware
  io.use(socketAuth);

  // Initialize controller and register connection handler
  const socketController = new SocketController(io, expressApp);

  io.on('connection', (socket) => {
    socketController.handleConnection(socket);
  });

  io.on('error', (err) => {
    console.error('Socket.IO error', err);
  });

  return io;
}