// Re-export shared types
export * from './shared';

export interface Card {
  id: number;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  cardCount: number;
  hand: Card[];
}

export interface PileType {
  index: number;
  type: 'ascending' | 'descending';
  startValue: number;
}

export interface Pile {
  cards: Card[];
  type: PileType;
}

export interface GameState {
  gameId?: string;
  piles: Pile[];
  deck: Card[];
  currentPlayer: number;
  players: Player[];
  cardsPlayedThisTurn: number;
  turnEnded: boolean;
}
