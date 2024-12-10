import React, { useState } from 'react';
import { createLobby, joinLobby } from '../services/lobbyService';
import './MultiplayerSetup.css';

interface MultiplayerSetupProps {
    playerId: string;
    playerName: string;
    onJoinGame: (gameId: string) => void;
    onCreateGame: (gameId: string) => void;
    onCancel: () => void;
}

export function MultiplayerSetup({ 
    playerId, 
    playerName,
    onJoinGame, 
    onCreateGame,
    onCancel 
}: MultiplayerSetupProps) {
    const [gameCode, setGameCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateGame = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Creating new game as:', { playerId, playerName });
            const gameId = await createLobby(playerId, playerName);
            console.log('Created game:', gameId);
            onCreateGame(gameId);
        } catch (err) {
            console.error('Error creating game:', err);
            setError(err instanceof Error ? err.message : 'Failed to create game');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinGame = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gameCode.trim()) {
            setError('Please enter a game code');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            console.log('Joining game:', gameCode, 'as:', { playerId, playerName });
            await joinLobby(gameCode.trim(), playerId, playerName);
            console.log('Successfully joined game:', gameCode);
            onJoinGame(gameCode.trim());
        } catch (err) {
            console.error('Error joining game:', err);
            setError(err instanceof Error ? err.message : 'Failed to join game');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="multiplayer-setup">
            <h2>Multiplayer Setup</h2>
            
            {error && <div className="error">{error}</div>}
            
            <div className="setup-options">
                <div className="create-game">
                    <h3>Create New Game</h3>
                    <button 
                        onClick={handleCreateGame}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Create Game'}
                    </button>
                </div>

                <div className="join-game">
                    <h3>Join Existing Game</h3>
                    <form onSubmit={handleJoinGame}>
                        <input
                            type="text"
                            value={gameCode}
                            onChange={(e) => setGameCode(e.target.value)}
                            placeholder="Enter Game Code"
                            disabled={isLoading}
                        />
                        <button 
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Joining...' : 'Join Game'}
                        </button>
                    </form>
                </div>
            </div>

            <button 
                className="cancel-button"
                onClick={onCancel}
                disabled={isLoading}
            >
                Back to Menu
            </button>
        </div>
    );
}
