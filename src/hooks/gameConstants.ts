// Hand Sizes
export const SOLITAIRE_HAND_SIZE = 10;
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
  WIDTH: 200,
  HEIGHT: 200,
  BORDER_RADIUS: 90,
  INSET_WIDTH_PERCENTAGE: 70,
  INSET_HEIGHT_PERCENTAGE: 75
} as const;

// Colors
export const COLORS = {
  ASCENDING_PILE: 'rgb(200, 240, 200)',
  DESCENDING_PILE: 'rgb(255, 200, 200)',
  INSET_GRADIENT_START: '#d0d4d8',
  INSET_GRADIENT_END: '#a8b0b8'
} as const;