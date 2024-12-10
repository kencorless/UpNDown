// Game Constants
export const PILE_TYPES = {
  UP: 'UP',
  DOWN: 'DOWN'
} as const;

export const START_VALUES = {
  UP: 1,
  DOWN: 100
} as const;

// Game Types
export type PileType = typeof PILE_TYPES[keyof typeof PILE_TYPES];
export type GameMode = 'solitaire' | 'multiplayer';

// Game Interfaces
export interface Card {
  id: string;
  value: number;
  suit?: string;
}

export interface Pile {
  id: string;
  type: PileType;
  cards: Card[];
  startValue: number;
  currentValue: number;
  label: string;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  cardCount: number;
  isHost: boolean;
  isReady?: boolean;
  joinedAt: number;
}

export interface GameState {
  gameId: string;
  gameMode: GameMode;
  players: Player[];
  currentPlayer: number;
  foundationPiles: Pile[];
  drawPile: Card[];
  cardsPlayedThisTurn: number;
  minCardsPerTurn: number;
  turnEnded: boolean;
  gameOver: boolean;
  lastUpdate: number;
}

export interface GameLobby {
  id: string;
  host: Player;
  players: Player[];
  maxPlayers: number;
  status: LobbyStatus;
  createdAt: number;
}

export type LobbyStatus = 'creating' | 'joining' | 'waiting' | 'ready' | 'error';
