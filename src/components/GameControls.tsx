import React, { useState } from 'react';
import { GameStatus } from '../types/game.types';
import { useGame } from '../contexts/GameContext';
import './GameControls.css';

interface GameControlsProps {
  gameState: {
    gameStatus: GameStatus;
    players: { id: string }[];
    initiatorId: string;
    cardsPlayedThisTurn: number;
    drawPile: unknown[];
  };
  playerId: string;
  selectedCards: string[];
  onEndTurn: () => Promise<void>;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  playerId,
  selectedCards,
  onEndTurn
}) => {
  const { startGame, resetGame } = useGame();
  const [error, setError] = useState<string | null>(null);

  const isCurrentPlayer = gameState.players[0]?.id === playerId;
  const canStartGame = gameState.gameStatus === 'WAITING' && 
                      gameState.players.length >= 2 && 
                      gameState.initiatorId === playerId;
  const canEndTurn = isCurrentPlayer && 
                    (gameState.cardsPlayedThisTurn >= 2 || gameState.drawPile.length === 0);

  const handleStartGame = async () => {
    try {
      setError(null);
      await startGame();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    }
  };

  const handleEndTurn = async () => {
    try {
      setError(null);
      await onEndTurn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end turn');
    }
  };

  const handleResetGame = async () => {
    try {
      setError(null);
      await resetGame();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset game');
    }
  };

  return (
    <div className="game-controls">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="controls-container">
        {canStartGame && (
          <button
            className="control-button start-game"
            onClick={handleStartGame}
          >
            Start Game
          </button>
        )}

        {gameState.gameStatus === 'IN_PROGRESS' && (
          <>
            {canEndTurn && (
              <button
                className="control-button end-turn"
                onClick={handleEndTurn}
                disabled={!canEndTurn}
              >
                End Turn
              </button>
            )}
            <button
              className="control-button reset-game"
              onClick={handleResetGame}
            >
              Reset Game
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GameControls;
