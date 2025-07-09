
export interface User {
    name: string,
    email: string,
    picture?: string,
    sub: string
}


export interface Player extends User {
    team: string,
    isHost: boolean,
    joined: boolean,
    jonedAt: number,
}


export interface Lobby {
  id: string;
  created_at: number;
  status: 'waiting' | 'ingame' | 'finished' ;
  host: User;
  players: Player[];
}

export interface Chronicles {
    sno: number,
    player: string,
    action: string
}


export interface Game {
    game_id: string,
    lobby_id: string,
    players: {[key: string]: Player},
    status: 'ongoing' | 'finished',
    narrative: string,
    chronicles: Chronicles[]
}

export interface OllamaMessage {
    role: 'system'| 'assistent' | 'user',
    content: string
}

export interface JudgeResponse {
  accepted: boolean;
  playerAction: string;
  reasons: string[];
  score: number; 
  revisedAction: string; 
  updatedContext: string; 
}