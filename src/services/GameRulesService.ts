import { Card, GameState, PileType, GameValidation } from '../types/game.types';

export class GameRulesService {
  static validateCardPlay(card: Card, pile: Card[], pileType: PileType): boolean {
    if (pile.length === 0) {
      return true;
    }

    const topCard = pile[pile.length - 1];
    
    if (pileType === 'ASCENDING') {
      // Can play higher number or exactly 10 lower
      return card.value > topCard.value || card.value === topCard.value - 10;
    } else {
      // Can play lower number or exactly 5 higher
      return card.value < topCard.value || card.value === topCard.value + 5;
    }
  }

  static validateTurn(gameState: GameState, playerId: string, cards: Card[]): GameValidation {
    // Check if it's the player's turn
    if (gameState.players[gameState.currentPlayerIndex].id !== playerId) {
      return {
        valid: false,
        message: 'Not your turn'
      };
    }

    // Must play at least 2 cards unless draw pile is empty
    if (gameState.drawPile.length > 0 && cards.length < 2) {
      return {
        valid: false,
        message: 'You must play at least 2 cards when the draw pile is not empty'
      };
    }

    // Cannot play more cards than in hand
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return {
        valid: false,
        message: 'Player not found'
      };
    }

    if (cards.length > player.hand.length) {
      return {
        valid: false,
        message: 'Cannot play more cards than you have in hand'
      };
    }

    // Check if all cards are actually in the player's hand
    const cardIds = new Set(cards.map(c => c.id));
    const handCardIds = new Set(player.hand.map(c => c.id));
    if (!Array.from(cardIds).every(id => handCardIds.has(id))) {
      return {
        valid: false,
        message: 'Invalid cards selected'
      };
    }

    return { valid: true };
  }

  static canEndTurn(gameState: GameState): boolean {
    return gameState.cardsPlayedThisTurn >= 2 || gameState.drawPile.length === 0;
  }

  static isGameOver(gameState: GameState): boolean {
    // Game is over if any player has no cards
    const playersWithoutCards = gameState.players.filter(p => p.hand.length === 0);
    if (playersWithoutCards.length > 0) {
      return true;
    }

    // Game is over if no valid moves are possible
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Check if any card can be played on any pile
    for (const card of currentPlayer.hand) {
      for (const pile of gameState.piles) {
        if (this.validateCardPlay(card, pile.cards, pile.type)) {
          return false;
        }
      }
    }

    return true;
  }

  static getValidPiles(gameState: GameState, cards: Card[]): string[] {
    const validPiles: string[] = [];

    for (const pile of gameState.piles) {
      let isValidPile = true;
      for (const card of cards) {
        if (!this.validateCardPlay(card, pile.cards, pile.type)) {
          isValidPile = false;
          break;
        }
      }
      if (isValidPile) {
        validPiles.push(pile.id);
      }
    }

    return validPiles;
  }
}
