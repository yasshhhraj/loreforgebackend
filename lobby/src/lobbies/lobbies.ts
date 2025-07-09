import { Lobby } from "../types";

export const lobbies = new Map<string, Lobby>();

export function getLobby(lobby_id) {
  return lobbies.get(lobby_id);
}
