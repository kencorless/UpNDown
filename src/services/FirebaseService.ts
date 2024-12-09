import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  onValue, 
  off,
  DataSnapshot
} from 'firebase/database';
import { 
  GameState, 
  Player, 
  Card, 
  GameError, 
  createGameError 
} from '../types';
import { safelyParseGameState } from '../utils';

export class FirebaseService {
  private static db = getDatabase();
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY = 1000; // 1 second

  private static async retryOperation<T>(
    operation: () => Promise<T>, 
    description: string
  ): Promise<T> {
    let lastError: any = null;
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`${description} - Attempt ${attempt} failed`, error);
        lastError = error;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
    
    // If all retries fail, throw the last error
    throw createGameError(
      'NETWORK', 
      `Failed after ${this.MAX_RETRIES} attempts: ${description}`, 
      lastError
    );
  }

  private static validateGameState(gameState: GameState): boolean {
    if (!gameState) return false;
    
    // Validate required fields
    const requiredFields: (keyof GameState)[] = [
      'gameId', 
      'gameStatus', 
      'players', 
      'currentPlayerIndex', 
      'drawPile', 
      'piles'
    ];
    
    for (const field of requiredFields) {
      if (gameState[field] === undefined) {
        console.error(`Invalid game state: Missing ${field}`);
        return false;
      }
    }

    // Validate players array
    if (!Array.isArray(gameState.players)) {
      console.error('Invalid game state: players must be an array');
      return false;
    }

    // Validate player objects
    const validPlayers = gameState.players.every(player => 
      player && 
      typeof player === 'object' && 
      typeof player.id === 'string' && 
      typeof player.name === 'string'
    );

    if (!validPlayers) {
      console.error('Invalid game state: Invalid player objects');
      return false;
    }

    return true;
  }

  static async saveGameState(
    gameId: string, 
    gameState: GameState
  ): Promise<void> {
    // Validate game state before saving
    if (!this.validateGameState(gameState)) {
      throw createGameError(
        'VALIDATION', 
        'Invalid game state cannot be saved'
      );
    }

    return this.retryOperation(
      async () => {
        await set(
          ref(this.db, `games/${gameId}`), 
          JSON.parse(JSON.stringify(gameState))
        );
      },
      `Save game state for game ${gameId}`
    );
  }

  static async getGameState(
    gameId: string
  ): Promise<GameState | null> {
    return this.retryOperation(
      async () => {
        const snapshot = await get(ref(this.db, `games/${gameId}`));
        const rawState = snapshot.val();
        
        return rawState 
          ? safelyParseGameState(rawState, gameId) 
          : null;
      },
      `Get game state for game ${gameId}`
    );
  }

  static async savePlayerHand(
    gameId: string, 
    playerId: string, 
    hand: Card[]
  ): Promise<void> {
    // Validate hand
    if (!Array.isArray(hand)) {
      throw createGameError(
        'VALIDATION', 
        'Invalid hand: must be an array of cards'
      );
    }

    return this.retryOperation(
      async () => {
        await update(
          ref(this.db, `games/${gameId}/players`), 
          { [playerId]: { hand } }
        );
      },
      `Save player hand for player ${playerId} in game ${gameId}`
    );
  }

  static async getPlayerHand(
    gameId: string, 
    playerId: string
  ): Promise<Card[]> {
    return this.retryOperation(
      async () => {
        const snapshot = await get(
          ref(this.db, `games/${gameId}/players/${playerId}/hand`)
        );
        return snapshot.val() || [];
      },
      `Get player hand for player ${playerId} in game ${gameId}`
    );
  }

  static subscribeToGame(
    gameId: string, 
    callback: (state: GameState | null) => void
  ): () => void {
    const gameRef = ref(this.db, `games/${gameId}`);
    
    const wrappedCallback = (snapshot: DataSnapshot) => {
      try {
        const rawState = snapshot.val();
        const parsedState = rawState 
          ? safelyParseGameState(rawState, gameId) 
          : null;
        
        // Additional validation before calling callback
        if (parsedState === null || this.validateGameState(parsedState)) {
          callback(parsedState);
        } else {
          console.warn('Invalid game state received', rawState);
        }
      } catch (error) {
        console.error('Error in game subscription callback', error);
      }
    };
    
    onValue(gameRef, wrappedCallback);
    
    return () => {
      off(gameRef, 'value', wrappedCallback);
    };
  }

  static async resetAllGames(): Promise<void> {
    try {
      await set(ref(this.db, 'games'), null);
    } catch (error) {
      throw createGameError(
        'NETWORK', 
        'Failed to reset all games', 
        error
      );
    }
  }
}
