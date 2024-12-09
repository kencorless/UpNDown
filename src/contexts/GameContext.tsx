import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { GameState, Card, Player, PreferenceLevel, createInitialPiles } from '../types/game.types';
import { GameRulesService } from '../services/GameRulesService';

type GameAction =
  | { type: 'UPDATE_GAME_STATE'; payload: GameState }
  | { type: 'SELECT_CARD'; payload: { cardId: string } }
  | { type: 'PLAY_CARDS'; payload: { cards: Card[]; pileId: string } }
  | { type: 'UPDATE_PREFERENCES'; payload: { pileId: string; level: PreferenceLevel } }
  | { type: 'START_GAME' }
  | { type: 'END_TURN' }
  | { type: 'RESET_GAME' };

const initialState: GameState = {
  gameId: '',
  gameStatus: 'WAITING',
  players: [],
  currentPlayerIndex: 0,
  drawPile: [],
  piles: createInitialPiles(),
  cardsPlayedThisTurn: 0,
  initiatorId: '',
  created: Date.now(),
  selectedCards: []
};

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  currentPlayerId: string | undefined;
  isCurrentPlayer: boolean;
  playCards: (cards: Card[], pileId: string) => Promise<void>;
  updatePreferences: (pileId: string, level: PreferenceLevel) => Promise<void>;
  startGame: () => Promise<void>;
  endTurn: () => Promise<void>;
  resetGame: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'UPDATE_GAME_STATE':
      return { ...state, ...action.payload };
      
    case 'SELECT_CARD':
      return {
        ...state,
        selectedCards: state.selectedCards?.includes(action.payload.cardId)
          ? (state.selectedCards || []).filter(id => id !== action.payload.cardId)
          : [...(state.selectedCards || []), action.payload.cardId]
      };
    
    case 'PLAY_CARDS':
      const { cards, pileId } = action.payload;
      const targetPile = state.piles.find(p => p.id === pileId);
      if (!targetPile) return state;

      const currentPlayerId = state.players[state.currentPlayerIndex]?.id;
      if (!currentPlayerId) return state;

      const validation = GameRulesService.validateTurn(state, currentPlayerId, cards);
      if (!validation.valid) return state;

      return {
        ...state,
        piles: state.piles.map(p => 
          p.id === pileId 
            ? { ...p, cards: [...p.cards, ...cards] }
            : p
        ),
        cardsPlayedThisTurn: state.cardsPlayedThisTurn + cards.length,
        players: state.players.map(p =>
          p.id === currentPlayerId
            ? { ...p, hand: p.hand.filter(c => !cards.some(pc => pc.id === c.id)) }
            : p
        ),
        selectedCards: []
      };

    case 'UPDATE_PREFERENCES':
      const { pileId: prefPileId, level } = action.payload;
      const playerId = state.players[state.currentPlayerIndex]?.id;
      if (!playerId) return state;

      return {
        ...state,
        piles: state.piles.map(p =>
          p.id === prefPileId
            ? { ...p, preferences: { ...p.preferences, [playerId]: level } }
            : p
        )
      };

    case 'START_GAME':
    case 'END_TURN':
    case 'RESET_GAME':
      return state; // These are handled by the GameEngine
      
    default:
      return state;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const currentPlayerId = state.players[state.currentPlayerIndex]?.id;
  const isCurrentPlayer = Boolean(currentPlayerId && state.players[state.currentPlayerIndex]?.id === currentPlayerId);

  const playCards = useCallback(async (cards: Card[], pileId: string) => {
    if (!currentPlayerId) return;
    dispatch({
      type: 'PLAY_CARDS',
      payload: { cards, pileId }
    });
  }, [currentPlayerId]);

  const updatePreferences = useCallback(async (pileId: string, level: PreferenceLevel) => {
    if (!currentPlayerId) return;
    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: { pileId, level }
    });
  }, [currentPlayerId]);

  const startGame = useCallback(async () => {
    dispatch({ type: 'START_GAME' });
  }, []);

  const endTurn = useCallback(async () => {
    dispatch({ type: 'END_TURN' });
  }, []);

  const resetGame = useCallback(async () => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return (
    <GameContext.Provider 
      value={{ 
        state, 
        dispatch, 
        currentPlayerId, 
        isCurrentPlayer,
        playCards, 
        updatePreferences,
        startGame,
        endTurn,
        resetGame
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
