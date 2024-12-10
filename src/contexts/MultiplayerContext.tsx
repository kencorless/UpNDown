import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { MultiplayerContextType, MultiplayerState, MultiplayerAction } from '../types/context';

const initialState: MultiplayerState = {
  isHost: false,
  connectedPlayers: [],
  gameId: null,
  isConnecting: false,
  error: null,
};

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

function multiplayerReducer(state: MultiplayerState, action: MultiplayerAction): MultiplayerState {
  switch (action.type) {
    case 'CREATE_GAME':
      return {
        ...state,
        isHost: true,
        gameId: action.payload.gameId,
        connectedPlayers: [{
          id: action.payload.hostId,
          name: action.payload.hostName,
          isHost: true,
          cardCount: 0,
          joinedAt: Date.now(),
        }],
        error: null,
      };
    case 'JOIN_GAME':
      return {
        ...state,
        isHost: false,
        gameId: action.payload.gameId,
        connectedPlayers: [...state.connectedPlayers, {
          id: action.payload.playerId,
          name: action.payload.playerName,
          isHost: false,
          cardCount: 0,
          joinedAt: Date.now(),
        }],
        error: null,
      };
    case 'PLAYER_CONNECTED':
      if (state.connectedPlayers.some(p => p.id === action.payload.playerId)) {
        return state;
      }
      return {
        ...state,
        connectedPlayers: [...state.connectedPlayers, {
          id: action.payload.playerId,
          name: action.payload.playerName,
          isHost: false,
          cardCount: 0,
          joinedAt: Date.now(),
        }],
      };
    case 'PLAYER_DISCONNECTED':
      return {
        ...state,
        connectedPlayers: state.connectedPlayers.filter(
          player => player.id !== action.payload.playerId
        ),
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isConnecting: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function MultiplayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(multiplayerReducer, initialState);

  return (
    <MultiplayerContext.Provider value={{ state, dispatch }}>
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayer(): MultiplayerContextType {
  const context = useContext(MultiplayerContext);
  if (context === undefined) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
}
