import React, { createContext, useContext, useReducer } from 'react';
import { 
  type Card, 
  type GameState, 
  type Pile, 
  PILE_TYPES 
} from '../types/gameTypes';
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

const sortCards = (cards: Card[]): Card[] => {
  return [...cards].sort((a, b) => a.value - b.value);
};

const canPlayOnUpPile = (card: Card, currentValue: number): boolean => {
  const isHigher = card.value > currentValue;
  const isTenLess = card.value === currentValue - 10;
  console.log('Ascending pile check:', {
    cardValue: card.value,
    currentValue,
    isHigher,
    isTenLess,
    isValid: isHigher || isTenLess
  });
  return isHigher || isTenLess;
};

const canPlayOnDownPile = (card: Card, currentValue: number): boolean => {
  const isLower = card.value < currentValue;
  const isTenMore = card.value === currentValue + 10;
  console.log('Descending pile check:', {
    cardValue: card.value,
    currentValue,
    isLower,
    isTenMore,
    isValid: isLower || isTenMore
  });
  return isLower || isTenMore;
};

const isValidPlay = (card: Card, pile: Pile): boolean => {
  // For first card on the pile
  if (pile.cards.length === 0) {
    if (pile.type === PILE_TYPES.UP) {
      const isValid = card.value >= pile.startValue;
      console.log('First card on ascending pile:', {
        cardValue: card.value,
        startValue: pile.startValue,
        isValid
      });
      return isValid;
    }
    const isValid = card.value <= pile.startValue;
    console.log('First card on descending pile:', {
      cardValue: card.value,
      startValue: pile.startValue,
      isValid
    });
    return isValid;
  }

  // For subsequent cards
  return pile.type === PILE_TYPES.UP 
    ? canPlayOnUpPile(card, pile.currentValue)
    : canPlayOnDownPile(card, pile.currentValue);
};

const hasValidMove = (hand: Card[], piles: Pile[]): boolean => {
  // Check each card in hand against each pile
  const possibleMoves = hand.map(card => ({
    cardValue: card.value,
    validPiles: piles.filter(pile => isValidPlay(card, pile)).map(p => p.id)
  }));

  console.log('Valid moves check:', {
    hand: hand.map(c => c.value),
    possibleMoves
  });

  return hand.some(card => piles.some(pile => isValidPlay(card, pile)));
};

const isSpecialPlay = (card: Card, pile: Pile): boolean => {
  if (pile.type === PILE_TYPES.UP) {
    return card.value === pile.currentValue - 10;
  } else {
    return card.value === pile.currentValue + 10;
  }
};

const calculateMovement = (card: Card, pile: Pile): number => {
  // If it's a special play (-10 or +10), return -10
  if (isSpecialPlay(card, pile)) {
    return -10;
  }
  
  // For normal plays, return absolute difference
  return Math.abs(card.value - pile.currentValue);
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

      console.log('Attempting to play:', {
        cardValue: card.value,
        pileType: pile.type,
        currentValue: pile.currentValue,
        isFirstCard: pile.cards.length === 0,
        startValue: pile.startValue
      });

      if (!isValidPlay(card, pile)) {
        const errorMsg = pile.cards.length === 0
          ? `First card on ${pile.type} pile must be ${pile.type === PILE_TYPES.UP ? 'greater than' : 'less than'} ${pile.startValue}`
          : `Cannot play ${card.value} on ${pile.type} pile with current value ${pile.currentValue}`;
        
        console.log('Invalid play:', errorMsg);
        return {
          ...state,
          error: errorMsg
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

        const movement = calculateMovement(card, pile);
        const updatedPlayers = gameState.players.map((p, i) =>
          i === gameState.currentPlayer
            ? {
                ...p,
                hand: newHand,
                cardCount: newHand.length,
                stats: {
                  ...p.stats,
                  totalCardsPlayed: p.stats.totalCardsPlayed + 1,
                  specialPlaysCount: isSpecialPlay(card, pile) ? p.stats.specialPlaysCount + 1 : p.stats.specialPlaysCount,
                  totalMovement: p.stats.totalMovement + movement
                }
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

        const isGameWon = newHand.length === 0 && newDrawPile.length === 0;
        const hasNoValidMoves = !hasValidMove(newHand, updatedPiles);

        console.log('Game state check:', {
          isGameWon,
          hasNoValidMoves,
          handSize: newHand.length,
          drawPileSize: newDrawPile.length
        });

        const newState = {
          ...gameState,
          players: updatedPlayers,
          foundationPiles: updatedPiles,
          drawPile: newDrawPile,
          cardsPlayedThisTurn: gameState.cardsPlayedThisTurn + 1,
          gameWon: isGameWon,
          gameOver: isGameWon || hasNoValidMoves,
          lastUpdate: Date.now()
        };

        console.log('Successfully played card:', card.value, 'on pile:', pileId);
        console.log('Movement:', movement, 'Special play:', isSpecialPlay(card, pile));
        return {
          ...state,
          gameState: newState,
          error: null
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to play card';
        console.error('Error playing card:', errorMessage);
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
        const updatedPiles = gameState.foundationPiles;
        const hasNoValidMoves = !hasValidMove(sortedHand, updatedPiles);

        console.log('Game state after draw:', {
          handSize: sortedHand.length,
          drawPileSize: newDeck.length,
          hasNoValidMoves
        });

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
            gameOver: hasNoValidMoves,
            gameWon: false,
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