import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameBoard } from '../components/GameBoard';
import { GameProvider } from '../contexts/GameContext';

// Mock the Firebase service
jest.mock('../services/FirebaseService', () => ({
  subscribeToGame: jest.fn(),
  getGameState: jest.fn(),
  getPlayerHand: jest.fn(),
}));

describe('GameBoard', () => {
  const renderGameBoard = () => {
    return render(
      <GameProvider>
        <GameBoard />
      </GameProvider>
    );
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should show loading spinner when game state is not available', () => {
    renderGameBoard();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show waiting message when game status is WAITING', () => {
    // Mock the useGame hook to return a waiting state
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      state: {
        gameStatus: 'WAITING',
        players: [],
        piles: [],
        currentPlayerId: '1',
        currentPlayerIndex: 0
      },
      dispatch: jest.fn()
    }));

    renderGameBoard();
    expect(screen.getByText(/waiting for players/i)).toBeInTheDocument();
  });

  it('should show current player turn message when game is in progress', () => {
    // Mock the useGame hook to return an in-progress state
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      state: {
        gameStatus: 'IN_PROGRESS',
        players: [
          { id: '1', name: 'Player 1', hand: [] },
          { id: '2', name: 'Player 2', hand: [] }
        ],
        piles: [],
        currentPlayerId: '1',
        currentPlayerIndex: 0
      },
      dispatch: jest.fn()
    }));

    renderGameBoard();
    expect(screen.getByText(/it's your turn/i)).toBeInTheDocument();
  });

  it('should handle card play correctly', () => {
    const mockDispatch = jest.fn();
    
    // Mock the useGame hook to return a playable state
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      state: {
        gameStatus: 'IN_PROGRESS',
        players: [
          { 
            id: '1', 
            name: 'Player 1',
            hand: [{ id: 'card1', value: 50 }]
          }
        ],
        piles: [
          {
            id: 'pile1',
            type: 'ASCENDING',
            cards: [],
            preferences: {}
          }
        ],
        currentPlayerId: '1',
        currentPlayerIndex: 0
      },
      dispatch: mockDispatch
    }));

    renderGameBoard();
    
    // Find and click a card
    const card = screen.getByText('50');
    fireEvent.click(card);

    // Verify dispatch was called with correct action
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SELECT_CARD',
        payload: expect.objectContaining({
          cardId: 'card1'
        })
      })
    );
  });

  it('should show error message when card play fails', async () => {
    const mockDispatch = jest.fn().mockImplementation(() => {
      throw new Error('Failed to play card');
    });

    // Mock the useGame hook to return a state that will cause an error
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      state: {
        gameStatus: 'IN_PROGRESS',
        players: [
          { 
            id: '1', 
            name: 'Player 1',
            hand: [{ id: 'card1', value: 50 }]
          }
        ],
        piles: [
          {
            id: 'pile1',
            type: 'ASCENDING',
            cards: [],
            preferences: {}
          }
        ],
        currentPlayerId: '1',
        currentPlayerIndex: 0
      },
      dispatch: mockDispatch
    }));

    renderGameBoard();
    
    // Find and click a card
    const card = screen.getByText('50');
    fireEvent.click(card);

    // Verify error message is shown
    expect(await screen.findByText(/failed to play card/i)).toBeInTheDocument();
  });
});
