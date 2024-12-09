import { v4 as uuidv4 } from 'uuid';
import { Card, Player, Pile, GameState, GameConfig, DEFAULT_GAME_CONFIG } from '../types';

export function generateUUID(): string {
  return uuidv4();
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function safelyParseGameState(rawState: any, gameId: string, config: GameConfig = DEFAULT_GAME_CONFIG): GameState {
  return {
    gameId: rawState.gameId || gameId,
    gameStatus: rawState.gameStatus || 'WAITING',
    players: Array.isArray(rawState.players) 
      ? rawState.players.filter((p: any): p is Player => 
          p && 
          typeof p === 'object' && 
          typeof p.id === 'string' &&
          typeof p.name === 'string' &&
          Array.isArray(p.hand)
        )
      : [],
    currentPlayerIndex: typeof rawState.currentPlayerIndex === 'number' 
      ? rawState.currentPlayerIndex 
      : 0,
    drawPile: Array.isArray(rawState.drawPile) ? rawState.drawPile : [],
    piles: createInitialPiles(config),
    cardsPlayedThisTurn: typeof rawState.cardsPlayedThisTurn === 'number' 
      ? rawState.cardsPlayedThisTurn 
      : 0,
    initiatorId: rawState.initiatorId || '',
    created: rawState.created || Date.now(),
    selectedCards: Array.isArray(rawState.selectedCards) 
      ? rawState.selectedCards 
      : []
  };
}

export function createInitialPiles(config: GameConfig = DEFAULT_GAME_CONFIG): Pile[] {
  return [
    { 
      id: 'ascending-1', 
      type: 'ASCENDING', 
      cards: [], 
      preferences: {}, 
      displayName: '↑' 
    },
    { 
      id: 'ascending-2', 
      type: 'ASCENDING', 
      cards: [], 
      preferences: {}, 
      displayName: '↑' 
    },
    { 
      id: 'descending-1', 
      type: 'DESCENDING', 
      cards: [], 
      preferences: {}, 
      displayName: '↓' 
    },
    { 
      id: 'descending-2', 
      type: 'DESCENDING', 
      cards: [], 
      preferences: {}, 
      displayName: '↓' 
    }
  ];
}

export function createShuffledDeck(config: GameConfig = DEFAULT_GAME_CONFIG): Card[] {
  const deck: Card[] = [];
  for (let i = config.minCardValue; i <= config.maxCardValue; i++) {
    deck.push({ 
      id: generateUUID(), 
      value: i 
    });
  }
  return shuffleArray(deck);
}

export function getRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', 
    '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B9B9B'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function dealCards(
  count: number, 
  deck: Card[], 
  config: GameConfig = DEFAULT_GAME_CONFIG
): { hand: Card[], remainingDeck: Card[] } {
  const hand = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  return { hand, remainingDeck };
}

export function validateGameState(state: GameState): boolean {
  return (
    state.players.length > 0 &&
    state.players.length <= DEFAULT_GAME_CONFIG.maxPlayers &&
    state.currentPlayerIndex >= 0 &&
    state.currentPlayerIndex < state.players.length
  );
}
