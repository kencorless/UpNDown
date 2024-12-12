export const PILE_TYPES = {
  UP: 'UP',
  DOWN: 'DOWN'
} as const;

export type PileType = typeof PILE_TYPES[keyof typeof PILE_TYPES];
export type GameMode = 'solitaire' | 'multiplayer';

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