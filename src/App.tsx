import React, { useState, useEffect, useMemo } from 'react';
import * as Sentry from "@sentry/react";
import { initSentry, SentryErrorBoundary } from './sentry';
import { Logger, LogLevel } from './logger';
import { PerformanceMonitor } from './performance';
import { GameEngine } from './game/GameEngine';
import { GameState, Card, PreferenceLevel } from './types/game.types';
import { GameBoard } from './components/GameBoard';
import { PlayerHand } from './components/PlayerHand';
import GameControls from './components/GameControls';
import './App.css';

const sharedGameEngine = new GameEngine();

function App() {
  const [gameEngine] = useState(() => sharedGameEngine);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [inputName, setInputName] = useState('');
  const [inputGameId, setInputGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [playerId, setPlayerId] = useState<string>('');
  const [canEndTurn, setCanEndTurn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize monitoring and logging
    try {
      // Set up Sentry
      initSentry();

      // Configure logging
      Logger.setLogLevel(
        process.env.NODE_ENV === 'production' 
          ? LogLevel.WARN 
          : LogLevel.DEBUG
      );

      // Log app initialization
      Logger.info('App initialized', {
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });

      // Performance tracking for app initialization
      PerformanceMonitor.start('AppInitialization');
      PerformanceMonitor.end('AppInitialization');
      PerformanceMonitor.logPerformance('AppInitialization');
    } catch (error) {
      Logger.trackError(error as Error, {
        context: 'App Initialization'
      });
    }
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    console.log('State changed:', { gameState, playerId, playerName });
  }, [gameState, playerId, playerName]);

  const handleJoinGame = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (inputGameId) {
        // Join existing game
        console.log('Joining game:', inputGameId);
        const player = await gameEngine.joinGame(inputGameId, inputName);
        console.log('Joined game, player:', player);
        
        // Get initial game state
        const initialState = await gameEngine.getGameState(inputGameId);
        console.log('Initial state after join:', initialState);
        
        if (!initialState) {
          throw new Error('Failed to get game state');
        }
        
        // Set all state at once to avoid race conditions
        setPlayerId(player.id);
        setPlayerName(inputName);
        setGameState(initialState);
      } else {
        // Create new game
        console.log('Creating new game');
        const { gameId, playerId } = await gameEngine.createGame(inputName);
        console.log('Game created:', { gameId, playerId });
        
        if (!gameId || !playerId) {
          throw new Error('Failed to create game');
        }
        
        // Get initial game state
        const initialState = await gameEngine.getGameState(gameId);
        console.log('Initial state after create:', initialState);
        
        if (!initialState) {
          throw new Error('Failed to get game state');
        }
        
        // Set all state at once to avoid race conditions
        setPlayerId(playerId);
        setPlayerName(inputName);
        setGameState(initialState);
        
        console.log('All state set:', { gameId, playerId, initialState });
      }
      
      // Clear input fields
      setInputName('');
      setInputGameId('');
    } catch (err) {
      console.error('Failed to join/create game:', err);
      setError(err instanceof Error ? err.message : 'Failed to join/create game');
      
      // Reset state on error
      setGameState(null);
      setPlayerId('');
      setPlayerName('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAllGames = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await gameEngine.resetAllGames();
      setGameState(null);
      setPlayerId('');
      setPlayerName('');
      setSelectedCards([]);
      setInputName('');
      setInputGameId('');
      console.log('All games reset successfully');
    } catch (err) {
      console.error('Failed to reset games:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset games');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!gameState?.gameId || !playerId) {
      console.log('No game state or player ID, skipping subscription');
      return;
    }

    console.log('Setting up game subscription for:', gameState.gameId);
    const unsubscribe = gameEngine.subscribeToGame(
      gameState.gameId,
      (newState) => {
        console.log('Received new game state:', newState);
        if (!newState) {
          console.warn('Received null game state');
          return;
        }

        // Ensure players is always an array
        const players = Array.isArray(newState.players) ? newState.players : [];
        
        // Check the structure of the received state
        console.log('Game state structure:', {
          gameId: newState.gameId,
          players: players.map(p => ({ id: p.id, name: p.name })),
          currentPlayer: players[newState.currentPlayerIndex],
          piles: newState.piles || [],
          status: newState.gameStatus
        });
        
        // Validate the state matches our game and player
        const playerInGame = players.some(p => p && typeof p === 'object' && p.id === playerId);
        if (newState.gameId === gameState.gameId && playerInGame) {
          console.log('Valid game state received, updating...');
          setGameState({
            ...newState,
            players: players
          });
        } else {
          console.warn('Invalid game state:', {
            expectedGameId: gameState.gameId,
            receivedGameId: newState.gameId,
            playerFound: playerInGame,
            players: players.map(p => ({ id: p.id, name: p.name }))
          });
        }
      },
      playerId
    );

    return () => {
      console.log('Cleaning up game subscription');
      unsubscribe();
    };
  }, [gameState?.gameId, playerId, gameEngine]);

  const currentPlayer = useMemo(() => {
    if (!gameState?.players || !Array.isArray(gameState.players)) {
      console.warn('No players array in game state');
      return null;
    }
    return gameState.players.find(p => p?.id === playerId) || null;
  }, [gameState?.players, playerId]);

  // Render game board or login screen
  if (gameState && playerId && currentPlayer) {
    console.log('Rendering game board with state:', {
      gameId: gameState.gameId,
      playerId,
      playerName: currentPlayer.name,
      players: gameState.players
    });

    return (
      <SentryErrorBoundary fallback={({ error }) => (
        <div>
          <h1>An error occurred</h1>
          <p>{error.message}</p>
        </div>
      )}>
        <div className="App">
          <div className="game-info">
            <h2>Game ID: {gameState.gameId}</h2>
            <p>Player: {currentPlayer.name}</p>
            <p>Status: {gameState.gameStatus}</p>
          </div>
          <GameBoard
            gameState={gameState}
            playerId={playerId}
            selectedCards={selectedCards}
            onPreferenceChange={() => Promise.resolve()}
            onCardPlay={() => Promise.resolve()}
          />
          <PlayerHand
            cards={currentPlayer.hand || []}
            selectedCards={selectedCards}
            onCardSelect={(cardId) => {
              setSelectedCards(prev => prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]);
            }}
            isMyTurn={gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === playerId)}
          />
          <GameControls
            gameState={gameState}
            playerId={playerId}
            selectedCards={selectedCards}
            onEndTurn={() => Promise.resolve()}
          />
        </div>
      </SentryErrorBoundary>
    );
  }

  console.log('Rendering login screen');
  return (
    <SentryErrorBoundary fallback={({ error }) => (
      <div>
        <h1>An error occurred</h1>
        <p>{error.message}</p>
      </div>
    )}>
      <div className="app">
        <div className="login-container">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Enter your name"
          />
          <input
            type="text"
            value={inputGameId}
            onChange={(e) => setInputGameId(e.target.value)}
            placeholder="Enter game ID (optional)"
          />
          <button
            disabled={!inputName || isLoading}
            onClick={handleJoinGame}
          >
            {inputGameId ? 'Join Game' : 'Create Game'}
          </button>
          <button
            onClick={handleResetAllGames}
            disabled={isLoading}
          >
            Reset All Games
          </button>
        </div>
      </div>
    </SentryErrorBoundary>
  );
}

export default Sentry.withProfiler(App);
