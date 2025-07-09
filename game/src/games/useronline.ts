import { Socket } from "socket.io";

export const players = new Map<string, Socket>();