import { GameRulesService } from '../services/GameRulesService';
import { Card, GameState } from '../types/game.types';

describe('GameRulesService', () => {
  describe('validateCardPlay', () => {
    it('should allow playing on empty pile', () => {
      const card: Card = { id: '1', value: 50 };
      const result = GameRulesService.validateCardPlay(card, [], 'ASCENDING');
      expect(result).toBe(true);
    });

    it('should validate ascending pile rules correctly', () => {
      const card: Card = { id: '2', value: 60 };
      const pile: Card[] = [{ id: '1', value: 50 }];
      const result = GameRulesService.validateCardPlay(card, pile, 'ASCENDING');
      expect(result).toBe(true);

      // Test 10 lower rule
      const lowerCard: Card = { id: '3', value: 40 };
      const lowerResult = GameRulesService.validateCardPlay(lowerCard, pile, 'ASCENDING');
      expect(lowerResult).toBe(true);

      // Test invalid play
      const invalidCard: Card = { id: '4', value: 45 };
      const invalidResult = GameRulesService.validateCardPlay(invalidCard, pile, 'ASCENDING');
      expect(invalidResult).toBe(false);
    });

    it('should validate descending pile rules correctly', () => {
      const card: Card = { id: '2', value: 40 };
      const pile: Card[] = [{ id: '1', value: 50 }];
      const result = GameRulesService.validateCardPlay(card, pile, 'DESCENDING');
      expect(result).toBe(true);

      // Test 5 higher rule
      const higherCard: Card = { id: '3', value: 55 };
      const higherResult = GameRulesService.validateCardPlay(higherCard, pile, 'DESCENDING');
      expect(higherResult).toBe(true);

      // Test invalid play
      const invalidCard: Card = { id: '4', value: 53 };
      const invalidResult = GameRulesService.validateCardPlay(invalidCard, pile, 'DESCENDING');
      expect(invalidResult).toBe(false);
    });
  });

  describe('validateTurn', () => {
    const mockGameState: GameState = {
      gameId: '1',
      gameStatus: 'IN_PROGRESS',
      players: [
        {
          id: 'player1',
          name: 'Player 1',
          isFinished: false,
          color: '#FF0000',
          hand: [
            { id: 'card1', value: 50 },
            { id: 'card2', value: 60 },
            { id: 'card3', value: 70 }
          ]
        }
      ],
      currentPlayerIndex: 0,
      drawPile: [{ id: 'card4', value: 80 }],
      piles: [],
      cardsPlayedThisTurn: 0,
      initiatorId: 'player1',
      created: Date.now()
    };

    it('should require 2 cards when draw pile is not empty', () => {
      const result = GameRulesService.validateTurn(
        mockGameState,
        'player1',
        [{ id: 'card1', value: 50 }]
      );
      expect(result.valid).toBe(false);
      expect(result.message).toContain('must play at least 2 cards');
    });

    it('should allow playing 1 card when draw pile is empty', () => {
      const gameState = {
        ...mockGameState,
        drawPile: []
      };
      const result = GameRulesService.validateTurn(
        gameState,
        'player1',
        [{ id: 'card1', value: 50 }]
      );
      expect(result.valid).toBe(true);
    });

    it('should not allow playing more cards than in hand', () => {
      const result = GameRulesService.validateTurn(
        mockGameState,
        'player1',
        [
          { id: 'card1', value: 50 },
          { id: 'card2', value: 60 },
          { id: 'card3', value: 70 },
          { id: 'card4', value: 80 }
        ]
      );
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Cannot play more cards than you have');
    });
  });
});
