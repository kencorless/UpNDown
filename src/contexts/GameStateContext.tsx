import React, { createContext, useContext, useReducer } from 'react';
import { type Card, type GameState, PILE_TYPES } from '../types/gameTypes';
import { drawCards } from '../utils/gameUtils';

type GameAction =
  | { type: 'START_GAME'; payload: GameState }
  | { type: 'END_GAME' }
  | { type: 'RESET' }
  | { type: 'UPDATE_GAME_STATE'; payload: GameState }
  | { type: 'PLAY_CARD'; payload: { cardIndex: number; pileId: string } }
  | { type: 'DRAW_CARD' };

interface GameStateContextType {
  gameState: GameState | null;
  selectedCard: { card: Card; index: number } | null;
  error: string | null;
}

const initialState: GameStateContextType = {
  gameState: null,
  selectedCard: null,
  error: null
};

const GameStateContext = createContext<{
  state: GameStateContextType;
  dispatch: React.Dispatch<GameAction>;
}>({
  state: initialState,
  dispatch: () => null
});

// Helper functions
const sortCards = (cards: Card[]): Card[] => {
  return [...cards].sort((a, b) => a.value - b.value);
};

const canPlayOnUpPile = (card: Card, currentValue: number): boolean => {
  return card.value > currentValue || card.value === currentValue - 10;
};

const canPlayOnDownPile = (card: Card, currentValue: number): boolean => {
  return card.value < currentValue || card.value === currentValue + 10;
};

const isValidPlay = (card: Card, pile: { type: 'UP' | 'DOWN', currentValue: number }): boolean => {
  return pile.type === PILE_TYPES.UP 
    ? canPlayOnUpPile(card, pile.currentValue)
    : canPlayOnDownPile(card, pile.currentValue);
};

function gameReducer(state: GameStateContextType, action: GameAction): GameStateContextType {
  console.log('Reducer action:', action.type);

  switch (action.type) {
    case 'START_GAME': {
      console.log('Starting new game with state:', action.payload);
      return {
        ...state,
        gameState: action.payload,
        error: null
      };
    }

    case 'END_GAME':
    case 'RESET': {
      console.log('Game ended or reset');
      return initialState;
    }

    case 'UPDATE_GAME_STATE': {
      console.log('Updating game state:', action.payload);
      return {
        ...state,
        gameState: action.payload,
        error: null
      };
    }

    case 'PLAY_CARD': {
      const gameState = state.gameState;
      if (!gameState) {
        return {
          ...state,
          error: 'No active game'
        };
      }

      const { cardIndex, pileId } = action.payload;
      const currentPlayer = gameState.players[gameState.currentPlayer];
      
      if (!currentPlayer) {
        return {
          ...state,
          error: 'No current player'
        };
      }

      const card = currentPlayer.hand[cardIndex];
      if (!card) {
        return {
          ...state,
          error: 'Invalid card index'
        };
      }

      const pile = gameState.foundationPiles.find(p => p.id === pileId);
      if (!pile) {
        return {
          ...state,
          error: 'Invalid pile'
        };
      }

      if (!isValidPlay(card, pile)) {
        return {
          ...state,
          error: `Cannot play ${card.value} on ${pile.type} pile with current value ${pile.currentValue}`
        };
      }

      try {
        const remainingHand = currentPlayer.hand.filter((_, idx) => idx !== cardIndex);
        
        // Draw a new card if there are cards in the draw pile
        let newHand = remainingHand;
        let newDrawPile = gameState.drawPile;
        
        if (gameState.drawPile.length > 0) {
          const drawResult = drawCards(gameState.drawPile, remainingHand, 1);
          newHand = sortCards(drawResult.newHand);
          newDrawPile = drawResult.newDeck;
        }

        const updatedPlayers = gameState.players.map((p, i) =>
          i === gameState.currentPlayer
            ? {
                ...p,
                hand: newHand,
                cardCount: newHand.length
              }
            : p
        );

        const updatedPiles = gameState.foundationPiles.map(p =>
          p.id === pileId
            ? { 
                ...p, 
                cards: [...p.cards, card],
                currentValue: card.value
              }
            : p
        );

        const newState = {
          ...gameState,
          players: updatedPlayers,
          foundationPiles: updatedPiles,
          drawPile: newDrawPile,
          cardsPlayedThisTurn: gameState.cardsPlayedThisTurn + 1,
          lastUpdate: Date.now()
        };

        console.log('Successfully played card:', card, 'on pile:', pileId);
        return {
          ...state,
          gameState: newState,
          error: null
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to play card';
        return {
          ...state,
          error: errorMessage
        };
      }
    }

    case 'DRAW_CARD': {
      const gameState = state.gameState;
      if (!gameState) {
        return {
          ...state,
          error: 'No active game'
        };
      }

      try {
        const currentPlayer = gameState.players[0];
        const { newHand, newDeck } = drawCards(
          gameState.drawPile,
          currentPlayer.hand,
          1
        );

        const sortedHand = sortCards(newHand);

        return {
          ...state,
          gameState: {
            ...gameState,
            players: [
              {
                ...currentPlayer,
                hand: sortedHand,
                cardCount: sortedHand.length
              },
              ...gameState.players.slice(1)
            ],
            drawPile: newDeck,
            lastUpdate: Date.now()
          },
          error: null
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to draw card';
        return {
          ...state,
          error: errorMessage
        };
      }
    }

    default: {
      console.log('Unknown action:', action);
      return state;
    }
  }
}

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameStateContext() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}