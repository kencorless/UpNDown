import React, { useState, useEffect } from 'react';
import { Card } from '../types/game.types';
import { useGame } from '../contexts/GameContext';
import { GameBoard } from './GameBoard';
import { PlayerHand } from './PlayerHand';
import { GameControls } from './GameControls';
import LoadingSpinner from './LoadingSpinner';
import './Game.css';

export const Game: React.FC = () => {
    const { 
        state: gameState, 
        currentPlayerId,
        isCurrentPlayer,
        endTurn
    } = useGame();
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    if (!gameState || !currentPlayerId) {
        return <LoadingSpinner />;
    }

    const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
    if (!currentPlayer) {
        return <div className="error-message">Player not found</div>;
    }

    const handleCardSelect = (cardId: string) => {
        setSelectedCards(prev => 
            prev.includes(cardId)
                ? prev.filter(id => id !== cardId)
                : [...prev, cardId]
        );
    };

    return (
        <div className="game">
            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}

            <GameBoard
                gameState={gameState}
                playerId={currentPlayerId}
                selectedCards={selectedCards}
                onPreferenceChange={async (pileId, level) => {
                    try {
                        // Handle preference change
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to update preference');
                    }
                }}
                onCardPlay={async (cards, pileId) => {
                    try {
                        // Handle card play
                        setSelectedCards([]);
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to play cards');
                    }
                }}
            />

            <div className="player-section">
                <PlayerHand
                    cards={currentPlayer.hand}
                    selectedCards={selectedCards}
                    onCardSelect={handleCardSelect}
                    isMyTurn={isCurrentPlayer}
                />

                <GameControls
                    gameState={gameState}
                    playerId={currentPlayerId}
                    selectedCards={selectedCards}
                    onEndTurn={endTurn}
                />
            </div>
        </div>
    );
};
