import { useState, useCallback } from 'react';
import { type GameState, type Player } from '../types/shared';

interface GameStateHook {
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
  updateGameState: (updater: (state: GameState) => GameState) => void;
  initializeGame: (playerId: string, playerName: string) => void;
}

const createInitialState = (playerId: string, playerName: string): GameState => {
  const timestamp = Date.now();
  
  const player: Player = {
    id: playerId,
    name: playerName,
    hand: [],
    cardCount: 0,
    isHost: true,
    isReady: true,
    joinedAt: timestamp
  };

  return {
    gameId: `game-${timestamp}`,
    gameMode: 'solitaire',
    players: [player],
    currentPlayer: 0,
    foundationPiles: [
      {
        id: 'up-1',
        type: 'UP',
        cards: [],
        label: 'UP 1',
        startValue: 1,
        currentValue: 1
      },
      {
        id: 'up-2',
        type: 'UP',
        cards: [],
        label: 'UP 2',
        startValue: 1,
        currentValue: 1
      },
      {
        id: 'down-1',
        type: 'DOWN',
        cards: [],
        label: 'DOWN 1',
        startValue: 100,
        currentValue: 100
      },
      {
        id: 'down-2',
        type: 'DOWN',
        cards: [],
        label: 'DOWN 2',
        startValue: 100,
        currentValue: 100
      }
    ],
    drawPile: [],
    cardsPlayedThisTurn: 0,
    minCardsPerTurn: 2,
    turnEnded: false,
    gameOver: false,
    lastUpdate: timestamp
  };
};

export function useGameStateHook(): GameStateHook {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const updateGameState = useCallback((updater: (state: GameState) => GameState) => {
    setGameState((currentState) => {
      if (!currentState) return null;
      const updatedState = updater(currentState);
      return {
        ...updatedState,
        lastUpdate: Date.now()
      };
    });
  }, []);

  const initializeGame = useCallback((playerId: string, playerName: string) => {
    setGameState(createInitialState(playerId, playerName));
  }, []);

  return {
    gameState,
    setGameState,
    updateGameState,
    initializeGame
  };
}