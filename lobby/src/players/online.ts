import { Socket } from 'socket.io';
import { User } from '../types';

export const users = new Map<string, User>();

/**
 * mapping user.sub to socket connection
 */
export const connections = new Map<string, Socket>();
/**
 * mapping socket id to lobby id thatsocket has joined
 */
export const socketlobby = new Map<string, string>();
/**
 * mapping user to lobby created by them.
 */
export const userownedLobby = new Map<string, string>();
