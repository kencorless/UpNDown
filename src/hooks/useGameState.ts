import { useCallback } from 'react';
import { useGameStateContext } from '../contexts/GameStateContext';
import { type GameState, PILE_TYPES, START_VALUES } from '../types/gameTypes';
import { createDeck, drawCards, shuffleDeck } from '../utils/gameUtils';

export function useGameState() {
  const { state, dispatch } = useGameStateContext();

  const initializeGame = useCallback((playerId: string, playerName: string) => {
    console.log('Initializing solitaire game for player:', playerId);
    const timestamp = Date.now();
    
    // Create and shuffle the deck
    const deck = shuffleDeck(createDeck());

    // Draw initial hand
    const { newHand, newDeck } = drawCards(deck, [], 8);
    
    const initialState: GameState = {
      gameId: `game-${timestamp}`,
      gameMode: 'solitaire',
      players: [{
        id: playerId,
        name: playerName,
        hand: newHand,
        cardCount: 8,
        isHost: true,
        isReady: true,
        joinedAt: timestamp
      }],
      currentPlayer: 0,
      foundationPiles: [
        {
          id: 'up-1',
          type: PILE_TYPES.UP,
          cards: [],
          startValue: START_VALUES.UP,
          currentValue: START_VALUES.UP,
          label: 'UP 1'
        },
        {
          id: 'up-2',
          type: PILE_TYPES.UP,
          cards: [],
          startValue: START_VALUES.UP,
          currentValue: START_VALUES.UP,
          label: 'UP 2'
        },
        {
          id: 'down-1',
          type: PILE_TYPES.DOWN,
          cards: [],
          startValue: START_VALUES.DOWN,
          currentValue: START_VALUES.DOWN,
          label: 'DOWN 1'
        },
        {
          id: 'down-2',
          type: PILE_TYPES.DOWN,
          cards: [],
          startValue: START_VALUES.DOWN,
          currentValue: START_VALUES.DOWN,
          label: 'DOWN 2'
        }
      ],
      drawPile: newDeck,
      cardsPlayedThisTurn: 0,
      minCardsPerTurn: 2,
      turnEnded: false,
      gameOver: false,
      lastUpdate: timestamp
    };

    console.log('Initial game state:', initialState);
    dispatch({ type: 'START_GAME', payload: initialState });
  }, [dispatch]);

  const playCard = useCallback((cardIndex: number, pileId: string) => {
    console.log('Playing card:', cardIndex, 'on pile:', pileId);
    dispatch({ type: 'PLAY_CARD', payload: { cardIndex, pileId } });
  }, [dispatch]);

  return {
    gameState: state.gameState,
    error: state.error,
    initializeGame,
    playCard
  };
}