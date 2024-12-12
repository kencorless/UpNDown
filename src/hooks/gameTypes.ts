// Game Constants
export const PILE_TYPES = {
  UP: 'UP',
  DOWN: 'DOWN'
} as const;

export const START_VALUES = {
  UP: 30,        
  DOWN: 78       
} as const;

export const SOLITAIRE_HAND_SIZE = 8;

// Card deck range
export const CARD_VALUES = {
  MIN: 30,      
  MAX: 78       
} as const;

// UI Constants
export const COLORS = {
  ASCENDING_PILE: 'rgb(200, 240, 200)',  // Light green
  DESCENDING_PILE: 'rgb(255, 200, 200)',  // Light pink
  INSET_GRADIENT_START: '#d0d4d8',
  INSET_GRADIENT_END: '#a8b0b8'
} as const;

// Game Types
export type PileType = typeof PILE_TYPES[keyof typeof PILE_TYPES];
export type GameMode = 'solitaire' | 'multiplayer';

// Player Statistics
export interface PlayerStats {
  totalCardsPlayed: number;
  specialPlaysCount: number;
  totalMovement: number;
}

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
  stats: PlayerStats;
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
  gameWon: boolean;
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