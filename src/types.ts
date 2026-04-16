export type PlayerColor = 'white' | 'black';

export interface GameState {
  id: string;
  fen: string;
  turn: 'w' | 'b';
  players: {
    white?: { id: string; socketId: string; color: PlayerColor };
    black?: { id: string; socketId: string; color: PlayerColor };
  };
  moveHistory: string[];
  isGameOver: boolean;
  gameOverReason?: string;
  winner?: PlayerColor;
}

export interface MoveData {
  from: string;
  to: string;
  promotion?: string;
}

export interface GameMove {
  from: string;
  to: string;
  san: string;
  fen: string;
}

export interface RoomInfo {
  gameId: string;
  playerColor: PlayerColor | null;
  isConnected: boolean;
  isGameFull: boolean;
}
