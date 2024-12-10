import { type FC, useState, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { type Player } from '../types/shared';
import { ref, onValue, off, set } from 'firebase/database';
import { database } from '../config/firebase';
import './GameLobby.css';

type LobbyStatus = 'waiting' | 'ready' | 'in_progress';

interface GameLobby {
  id: string;
  host: Player;
  players: Player[];
  status: LobbyStatus;
  maxPlayers: number;
  createdAt: number;
}

export const GameLobby: FC = () => {
  const { dispatch: uiDispatch } = useUI();
  const { state: multiplayerState } = useMultiplayer();
  const [lobby, setLobby] = useState<GameLobby | null>(null);

  useEffect(() => {
    if (!multiplayerState?.gameId) return;

    const unsubscribe = subscribeToLobby(multiplayerState.gameId, (updatedLobby) => {
      setLobby(updatedLobby);
    });

    return () => unsubscribe();
  }, [multiplayerState?.gameId]);

  const handleStartGame = async () => {
    if (!lobby || !multiplayerState?.connectedPlayers[0]?.id) return;

    if (lobby.players.length < 2) {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'Need at least 2 players to start',
          type: 'error',
          duration: 3000
        }
      });
      return;
    }

    if (lobby.host.id !== multiplayerState.connectedPlayers[0].id) {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'Only the host can start the game',
          type: 'error',
          duration: 3000
        }
      });
      return;
    }

    try {
      await startGame(lobby.id);
    } catch (error) {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'Failed to start game',
          type: 'error',
          duration: 3000
        }
      });
    }
  };

  if (!lobby) {
    return <div>Loading lobby...</div>;
  }

  return (
    <div className="game-lobby">
      <h2>Game Lobby</h2>
      <div className="lobby-info">
        <p>Host: {lobby.host.name}</p>
        <p>Players ({lobby.players.length}/{lobby.maxPlayers}):</p>
        <ul className="player-list">
          {lobby.players.map((player) => (
            <li key={player.id} className={player.id === lobby.host.id ? 'host' : ''}>
              {player.name} {player.id === lobby.host.id && '(Host)'}
            </li>
          ))}
        </ul>
      </div>
      {lobby.host.id === multiplayerState?.connectedPlayers[0]?.id && (
        <button
          onClick={handleStartGame}
          disabled={lobby.players.length < 2 || lobby.status === 'in_progress'}
        >
          Start Game
        </button>
      )}
    </div>
  );
};

// Helper functions
function subscribeToLobby(lobbyId: string, callback: (lobby: GameLobby) => void): () => void {
  const lobbyRef = ref(database, `lobbies/${lobbyId}`);
  const listener = onValue(lobbyRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });

  return () => off(lobbyRef, 'value', listener);
}

async function startGame(lobbyId: string): Promise<void> {
  const lobbyRef = ref(database, `lobbies/${lobbyId}`);
  onValue(lobbyRef, (snapshot) => {
    if (snapshot.exists()) {
      const lobby = snapshot.val();
      lobby.status = 'in_progress';
      set(lobbyRef, lobby);
    }
  });
}
