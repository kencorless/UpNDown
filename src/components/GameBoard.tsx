import React, { useState } from 'react';
import { Card, GameState, PreferenceLevel } from '../types/game.types';
import { Pile } from './Pile';
import { useGame } from '../contexts/GameContext';
import LoadingSpinner from './LoadingSpinner';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  playerId: string;
  selectedCards: string[];
  onPreferenceChange: (pileId: string, level: PreferenceLevel) => Promise<void>;
  onCardPlay: (cards: Card[], pileId: string) => Promise<void>;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  playerId,
  selectedCards,
  onPreferenceChange,
  onCardPlay
}) => {
  const [error, setError] = useState<string | null>(null);

  // Early return for loading state
  if (!gameState || !gameState.players || !gameState.piles) {
    return <LoadingSpinner />;
  }

  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === playerId;

  const handlePreferenceChange = async (pileId: string, level: PreferenceLevel) => {
    try {
      setError(null);
      await onPreferenceChange(pileId, level);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preference');
    }
  };

  const handleCardPlay = async (cards: Card[], pileId: string) => {
    try {
      setError(null);
      await onCardPlay(cards, pileId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play cards');
    }
  };

  return (
    <div className="game-board">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="game-status">
        {gameState.gameStatus === 'WAITING' && <div>Waiting for players...</div>}
        {gameState.gameStatus === 'IN_PROGRESS' && (
          <div>
            {isMyTurn 
              ? "It's your turn!" 
              : `Waiting for ${gameState.players[gameState.currentPlayerIndex]?.name}'s turn...`
            }
          </div>
        )}
      </div>

      <div className="piles-container grid grid-cols-2 gap-4 max-w-4xl mx-auto">
        {gameState.piles.map((pile) => (
          <Pile
            key={pile.id}
            pile={{
              ...pile,
              cards: pile.cards || [],
              preferences: pile.preferences || {}
            }}
            playerId={playerId}
            isCurrentPlayer={isMyTurn}
            onCardPlay={handleCardPlay}
            onPreferenceChange={handlePreferenceChange}
            players={gameState.players}
            gameStatus={gameState.gameStatus}
          />
        ))}
      </div>
    </div>
  );
};
