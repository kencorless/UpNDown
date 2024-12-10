import React from 'react';
import { useGameState } from './hooks/useGameState';
import { SolitaireGame } from './components/game/SolitaireGame';
import { MultiplayerGame } from './components/game/MultiplayerGame';
import { GameMenu } from './components/game/GameMenu';
import './App.css';

const App: React.FC = () => {
  const { gameState, initializeGame } = useGameState();

  const handleStartGame = (gameMode: 'solitaire' | 'multiplayer') => {
    const playerId = 'player1';
    const playerName = 'Player 1';

    console.log(`Starting ${gameMode} game for player:`, playerId);
    initializeGame(playerId, playerName);
  };

  return (
    <div className="App">
      {!gameState && <GameMenu onStartGame={handleStartGame} />}
      {gameState?.gameMode === 'solitaire' && <SolitaireGame />}
      {gameState?.gameMode === 'multiplayer' && <MultiplayerGame />}
    </div>
  );
};

export default App;