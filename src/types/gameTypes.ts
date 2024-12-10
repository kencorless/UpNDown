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
// Hand Sizes
export const SOLITAIRE_HAND_SIZE = 8;
export const MULTIPLAYER_HAND_SIZE = 6;

// Foundation Pile Settings
export const ASCENDING_START_VALUE = 1;
export const DESCENDING_START_VALUE = 100;
export const PILE_DIFFERENCE_RULE = 10;  // For the +10/-10 rule

// Game Play Rules
export const MIN_CARDS_PER_TURN = 2;
export const DEFAULT_MAX_PLAYERS = 8;

// Card Deck
export const MIN_CARD_VALUE = 2;
export const MAX_CARD_VALUE = 99;

// Game IDs/Labels
export const PILE_IDS = {
  UP_1: 'up-1',
  UP_2: 'up-2',
  DOWN_1: 'down-1',
  DOWN_2: 'down-2'
} as const;

export const PILE_LABELS = {
  UP_1: 'Ascending 1',
  UP_2: 'Ascending 2',
  DOWN_1: 'Descending 1',
  DOWN_2: 'Descending 2'
} as const;

// UI Dimensions
export const FOUNDATION_PILE_DIMENSIONS = {
  WIDTH: 720,
  HEIGHT: 1040,
  BORDER_RADIUS: 80,
  INSET_WIDTH_PERCENTAGE: 80,
  INSET_HEIGHT_PERCENTAGE: 85
} as const;

// Colors
export const COLORS = {
  ASCENDING_PILE: 'rgb(200, 240, 200)',
  DESCENDING_PILE: 'rgb(255, 200, 200)',
  INSET_GRADIENT_START: '#d0d4d8',
  INSET_GRADIENT_END: '#a8b0b8'
} as const;