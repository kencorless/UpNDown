import { 
  type Card, 
  type Pile, 
  type Player, 
  PILE_TYPES,
  CARD_VALUES,
  SOLITAIRE_HAND_SIZE,
  MULTIPLAYER_HAND_SIZE 
} from '../types/gameTypes';

// Type definitions
interface DealResult {
  hands: Card[][];
  drawPile: Card[];
}

interface InitialHandResult {
  hand: Card[];
  remainingDeck: Card[];
}

interface MultiplayerHandResult {
  player1Hand: Card[];
  player2Hand: Card[];
  remainingDeck: Card[];
}

interface AutoPlayResult {
  updatedHand: Card[];
  updatedPiles: Pile[];
  cardsPlayed: number;
}

/**
 * Creates and shuffles the initial deck of cards
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (let value = CARD_VALUES.MIN; value <= CARD_VALUES.MAX; value++) {
    deck.push({ id: `card-${value}`, value });
  }
  return shuffleDeck(deck);
}

/**
 * Shuffles the deck
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Sorts cards by value in ascending order
 */
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.value - b.value);
}

/**
 * Deals cards for a multiplayer game
 */
export function dealCards(deck: Card[], numPlayers: number): DealResult {
  if (numPlayers <= 0) {
    throw new Error('Number of players must be positive');
  }
  
  const hands: Card[][] = Array(numPlayers).fill([]).map(() => []);
  const deckCopy = [...deck];
  
  for (let i = 0; i < MULTIPLAYER_HAND_SIZE; i++) {
    for (let j = 0; j < numPlayers; j++) {
      if (deckCopy.length > 0) {
        const card = deckCopy.pop();
        if (card) {
          hands[j] = [...hands[j], card];
        }
      }
    }
  }

  hands.forEach((hand, index) => {
    hands[index] = sortCards(hand);
  });

  return {
    hands,
    drawPile: deckCopy
  };
}

/**
 * Deals initial hand to a player
 */
export function dealInitialHand(deck: Card[]): InitialHandResult {
  if (deck.length < SOLITAIRE_HAND_SIZE) {
    throw new Error(`Not enough cards in deck for initial hand. Required: ${SOLITAIRE_HAND_SIZE}`);
  }
  const hand = deck.slice(0, SOLITAIRE_HAND_SIZE);
  const remainingDeck = deck.slice(SOLITAIRE_HAND_SIZE);
  return { hand: sortCards(hand), remainingDeck };
}

/**
 * Deals hands for a multiplayer game
 */
export function dealMultiplayerHands(deck: Card[]): MultiplayerHandResult {
  const requiredCards = MULTIPLAYER_HAND_SIZE * 2;
  if (deck.length < requiredCards) {
    throw new Error(`Not enough cards for multiplayer game. Required: ${requiredCards}`);
  }
  
  const player1Hand = deck.slice(0, MULTIPLAYER_HAND_SIZE);
  const player2Hand = deck.slice(MULTIPLAYER_HAND_SIZE, requiredCards);
  const remainingDeck = deck.slice(requiredCards);

  return {
    player1Hand: sortCards(player1Hand),
    player2Hand: sortCards(player2Hand),
    remainingDeck
  };
}

/**
 * Validates if a card can be played on a specific pile
 */
export function isValidPlay(card: Card | null | undefined, pileCards: Card[], pileType: 'UP' | 'DOWN'): boolean {
  if (!card) return false;

  if (pileCards.length === 0) {
    return true;
  }

  const topCard = pileCards[pileCards.length - 1];
  if (!topCard) return false;

  if (pileType === 'UP') {
    return card.value > topCard.value || card.value === topCard.value - 10;
  } else {
    return card.value < topCard.value || card.value === topCard.value + 10;
  }
}

/**
 * Draws cards from the deck
 */
export function drawCards(
  deck: Card[], 
  hand: Card[], 
  count: number
): { newHand: Card[]; newDeck: Card[]; } {
  if (count < 0) {
    throw new Error('Count must be non-negative');
  }
  if (deck.length < count) {
    throw new Error('Not enough cards in deck');
  }

  const drawnCards = deck.slice(0, count);
  const newDeck = deck.slice(count);
  const newHand = sortCards([...hand, ...drawnCards]);

  return {
    newHand,
    newDeck
  };
}

/**
 * Updates the game state after a card is played
 */
export function updateGameState(
  prevState: {
    currentPlayer: number;
    players: Player[];
    foundationPiles: Pile[];
  },
  cardIndex: number,
  pileId: string
): typeof prevState | null {
  const playerIndex = prevState.currentPlayer;
  const player = prevState.players[playerIndex];
  const card = player.hand[cardIndex];
  const pile = prevState.foundationPiles.find(p => p.id === pileId);

  if (!pile || !card) return null;
  if (!isValidPlay(card, pile.cards, pile.type)) return null;

  const newState = { ...prevState };
  
  const newHand = [...player.hand];
  newHand.splice(cardIndex, 1);
  
  const newPile = {
    ...pile,
    cards: [...pile.cards, card]
  };

  newState.players[playerIndex] = {
    ...player,
    hand: newHand,
    cardCount: newHand.length
  };
  
  const pileIndex = newState.foundationPiles.findIndex(p => p.id === pileId);
  newState.foundationPiles[pileIndex] = newPile;

  return newState;
}

/**
 * Auto-plays cards from the hand
 */
export function autoPlay(hand: Card[], piles: Pile[]): AutoPlayResult {
  let updatedHand = [...hand];
  let updatedPiles = [...piles];
  let cardsPlayed = 0;

  let madeMove = true;
  while (madeMove && updatedHand.length > 0) {
    madeMove = false;
    
    for (let i = 0; i < updatedHand.length; i++) {
      const card = updatedHand[i];
      const validPiles = getValidMoves(card, updatedPiles);
      
      if (validPiles.length > 0) {
        const targetPile = validPiles.find(p => p.type === PILE_TYPES.UP) || validPiles[0];
        
        updatedPiles = updatedPiles.map(p =>
          p.id === targetPile.id
            ? { ...p, cards: [...p.cards, card] }
            : p
        );
        
        updatedHand = [...updatedHand.slice(0, i), ...updatedHand.slice(i + 1)];
        cardsPlayed++;
        madeMove = true;
        break;
      }
    }
  }

  return { updatedHand, updatedPiles, cardsPlayed };
}

// Utility functions with proper typing
export const hasValidMove = (hand: Card[], foundationPiles: Pile[]): boolean =>
  hand.some(card => foundationPiles.some(pile => isValidPlay(card, pile.cards, pile.type)));

export const getValidMoves = (card: Card, piles: Pile[]): Pile[] =>
  piles.filter(pile => isValidPlay(card, pile.cards, pile.type));

export const checkGameOver = (players: Player[], drawPile: Card[], foundationPiles: Pile[]): boolean =>
  drawPile.length === 0 && players.every(player => !hasValidMove(player.hand, foundationPiles));

export const checkWinCondition = (piles: Pile[]): boolean =>
  piles.every(pile => 
    (pile.type === PILE_TYPES.UP || pile.type === PILE_TYPES.DOWN) && 
    pile.cards.length === 13
  );