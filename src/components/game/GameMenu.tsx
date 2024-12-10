import React from 'react';
import { type GameMode } from '../../types/shared';

interface GameMenuProps {
  onStartGame: (gameMode: GameMode) => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({ onStartGame }) => {
  return (
    <div className="game-menu">
      <h1>Up 'n Down</h1>
      <div className="menu-buttons">
        <button onClick={() => onStartGame('solitaire')}>
          Start Solitaire Game
        </button>
        <button onClick={() => onStartGame('multiplayer')}>
          Start Multiplayer Game
        </button>
      </div>
    </div>
  );
};
