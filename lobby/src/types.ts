export interface User {
  name: string;
  email: string;
  picture?: string;
  sub: string;
}

export interface Player extends User {
  isHost: boolean;
  isReady: boolean;
  team: 'A' | 'B';
}

export interface Lobby {
  id: string;
  created_at: number;
  host: User;
  players: Player[];
}
