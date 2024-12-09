// Centralized Type Definitions

export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
export type PileType = 'ASCENDING' | 'DESCENDING';

export interface Card {
  id: string;
  value: number;
}

export const PLAYER_COLORS = [
  '#FF6B6B',  // Coral Red
  '#4ECDC4',  // Turquoise
  '#9B59B6',  // Purple
  '#F7D794',  // Mellow Yellow
  '#45B7D1',  // Sky Blue
  '#96C93D',  // Lime Green
  '#FF8F40',  // Orange
  '#5D6D7E',  // Slate
] as const;

export type PlayerColor = typeof PLAYER_COLORS[number];

export interface Player {
  id: string;
  name: string;
  isInitiator: boolean;
  isOnline: boolean;
  lastActive: number;
  isFinished: boolean;
  color: string;
  hand: Card[];
}

export type PreferenceLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface Pile {
  id: string;
  type: PileType;
  cards: Card[];
  preferences: { [playerId: string]: PreferenceLevel };
  displayName: string;
}

export interface GameState {
  gameId: string;
  gameStatus: GameStatus;
  players: Player[];
  currentPlayerIndex: number;
  drawPile: Card[];
  piles: Pile[];
  cardsPlayedThisTurn: number;
  initiatorId: string;
  created: number;
  selectedCards: string[];
}

export interface GameValidation {
  valid: boolean;
  message?: string;
}

export interface GameConfig {
  maxPlayers: number;
  initialHandSize: number;
  minCardValue: number;
  maxCardValue: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  maxPlayers: 4,
  initialHandSize: 6,
  minCardValue: 2,
  maxCardValue: 99
};

export interface GameError {
  type: 'VALIDATION' | 'PERMISSION' | 'STATE' | 'NETWORK';
  message: string;
  details?: any;
}

export function createGameError(
  type: GameError['type'], 
  message: string, 
  details?: any
): GameError {
  return { type, message, details };
}

export function createPile(id: string, type: PileType): Pile {
  return {
    id,
    type,
    cards: [],
    preferences: {},
    displayName: type === 'ASCENDING' ? '↑' : '↓'
  };
}

export function createInitialPiles(): Pile[] {
  return [
    createPile('ascending-1', 'ASCENDING'),
    createPile('ascending-2', 'ASCENDING'),
    createPile('descending-1', 'DESCENDING'),
    createPile('descending-2', 'DESCENDING')
  ];
}
