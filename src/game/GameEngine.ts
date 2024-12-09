import { 
  Card, 
  GameState, 
  Player, 
  GameStatus, 
  PreferenceLevel, 
  Pile, 
  PileType,
  createInitialPiles
} from '../types';
import { FirebaseService } from '../services/FirebaseService';
import { GameRulesService } from '../services/GameRulesService';
import { generateUUID, createShuffledDeck } from '../utils';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../firebase';

export class GameEngine {
    private currentGameId: string | null = null;
    private currentPlayerId: string | null = null;
    private subscriptions: { [key: string]: () => void } = {};

    public async createGame(playerName: string): Promise<{ gameId: string; playerId: string }> {
        console.log('Creating new game for player:', playerName);
        
        // Generate a 3-digit number between 100 and 999
        const gameId = String(Math.floor(Math.random() * 900 + 100));
        const playerId = generateUUID();
        
        // Create and shuffle the deck first
        const drawPile = createShuffledDeck();
        console.log('Created draw pile with', drawPile.length, 'cards');
        
        // Deal initial cards to the player
        const playerHand = drawPile.splice(0, 6);
        console.log('Dealt initial hand:', playerHand);

        const player: Player = {
          id: playerId,
          name: playerName,
          isInitiator: true,
          isOnline: true,
          lastActive: Date.now(),
          isFinished: false,
          color: '#FF6B6B',
          hand: playerHand
        };

        const initialState: GameState = {
          gameId,
          gameStatus: 'WAITING',
          players: [player], 
          currentPlayerIndex: 0,
          drawPile,
          piles: createInitialPiles(),
          cardsPlayedThisTurn: 0,
          initiatorId: playerId,
          created: Date.now(),
          selectedCards: []
        };

        console.log('Creating initial game state:', initialState);
        
        try {
          // Save the game state to Firebase
          await FirebaseService.saveGameState(gameId, initialState);
          console.log('Game state saved successfully');
          
          // Save player hand separately to ensure it's properly stored
          await FirebaseService.savePlayerHand(gameId, playerId, playerHand);
          console.log('Player hand saved successfully');
          
          this.currentGameId = gameId;
          this.currentPlayerId = playerId;

          return { gameId, playerId };
        } catch (error) {
          console.error('Error creating game:', error);
          throw new Error('Failed to create game');
        }
    }

    public async joinGame(gameId: string, playerName: string): Promise<Player> {
        const gameState = await FirebaseService.getGameState(gameId);
        if (!gameState) {
            throw new Error('Game not found');
        }

        if (gameState.gameStatus !== 'WAITING') {
            throw new Error('Cannot join game in progress');
        }

        const playerId = generateUUID();
        const player: Player = {
            id: playerId,
            name: playerName,
            isInitiator: false,
            isOnline: true,
            lastActive: Date.now(),
            isFinished: false,
            color: this.getRandomColor(),
            hand: []
        };

        gameState.players.push(player);
        await FirebaseService.saveGameState(gameId, gameState);
        
        // Deal initial cards
        const playerHand = this.dealCards(6);
        await this.updatePlayerHand(gameId, playerId, playerHand);
        
        return player;
    }

    public async startGame(gameId: string): Promise<void> {
        const gameState = await FirebaseService.getGameState(gameId);
        if (!gameState) {
            throw new Error('Game not found');
        }

        if (gameState.gameStatus !== 'WAITING') {
            throw new Error('Game has already started');
        }

        if (gameState.players.length < 2) {
            throw new Error('Need at least 2 players to start');
        }

        // Deal initial cards to all players if they don't have any
        await Promise.all(gameState.players.map(async (player) => {
            const hand = await FirebaseService.getPlayerHand(gameId, player.id);
            if (!hand || hand.length === 0) {
                const newHand = this.dealCards(6);
                await this.updatePlayerHand(gameId, player.id, newHand);
            }
        }));

        // Update game status
        gameState.gameStatus = 'IN_PROGRESS';
        gameState.currentPlayerIndex = 0;
        await FirebaseService.saveGameState(gameId, gameState);
    }

    public async playCards(gameId: string, playerId: string, cards: Card[], pileId: string): Promise<void> {
        const gameState = await FirebaseService.getGameState(gameId);
        if (!gameState) {
            throw new Error('Game not found');
        }

        const pile = gameState.piles.find(p => p.id === pileId);
        if (!pile) {
            throw new Error('Invalid pile');
        }

        const validation = GameRulesService.validateTurn(gameState, playerId, cards);
        if (!validation.valid) {
            throw new Error(validation.message);
        }

        // Update game state
        const playerHand = await FirebaseService.getPlayerHand(gameId, playerId);
        const updatedHand = playerHand.filter(card => !cards.some(c => c.id === card.id));
        
        pile.cards.push(...cards);
        gameState.cardsPlayedThisTurn += cards.length;

        // Save updates
        await Promise.all([
            FirebaseService.saveGameState(gameId, gameState),
            FirebaseService.savePlayerHand(gameId, playerId, updatedHand)
        ]);
    }

    public async endTurn(gameId: string, playerId: string): Promise<void> {
        const gameState = await FirebaseService.getGameState(gameId);
        if (!gameState) {
            throw new Error('Game not found');
        }

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.id !== playerId) {
            throw new Error('Not your turn');
        }

        if (gameState.cardsPlayedThisTurn < 2 && gameState.drawPile.length > 0) {
            throw new Error('Must play at least 2 cards if possible');
        }

        // Move to next player
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        gameState.cardsPlayedThisTurn = 0;

        // Check if game is finished
        const playerHand = await FirebaseService.getPlayerHand(gameId, playerId);
        if (playerHand.length === 0) {
            gameState.gameStatus = 'FINISHED';
        }

        await FirebaseService.saveGameState(gameId, gameState);
    }

    public async resetGame(gameId: string): Promise<void> {
        const gameState = await FirebaseService.getGameState(gameId);
        if (!gameState) {
            throw new Error('Game not found');
        }

        // Reset game state
        const newState: GameState = {
            ...gameState,
            gameStatus: 'WAITING',
            currentPlayerIndex: 0,
            cardsPlayedThisTurn: 0,
            drawPile: createShuffledDeck(),
            piles: createInitialPiles(),
        };

        // Reset all player hands
        await Promise.all([
            FirebaseService.saveGameState(gameId, newState),
            ...gameState.players.map(player => 
                FirebaseService.savePlayerHand(gameId, player.id, [])
            )
        ]);
    }

    public async resetAllGames(): Promise<void> {
        await FirebaseService.resetAllGames();
    }

    public async setStackPreference(gameId: string, pileId: string, playerId: string, level: PreferenceLevel): Promise<void> {
        const gameState = await FirebaseService.getGameState(gameId);
        if (!gameState) {
            throw new Error('Game not found');
        }

        const pile = gameState.piles.find(p => p.id === pileId);
        if (!pile) {
            throw new Error('Invalid pile');
        }

        pile.preferences[playerId] = level;
        await FirebaseService.saveGameState(gameId, gameState);
    }

    public async getGameState(gameId: string): Promise<GameState | null> {
        return await FirebaseService.getGameState(gameId);
    }

    public async validateCardPlay(gameId: string, pileId: string, card: Card): Promise<boolean> {
        const gameState = await this.getGameState(gameId);
        if (!gameState) return false;

        const pile = gameState.piles.find(p => p.id === pileId);
        if (!pile) return false;

        return GameRulesService.validateCardPlay(card, pile.cards, pile.type);
    }

    public async isGameOver(gameId: string): Promise<boolean> {
        const gameState = await this.getGameState(gameId);
        if (!gameState) return false;

        return GameRulesService.isGameOver(gameState);
    }

    public subscribeToGame(gameId: string, callback: (state: GameState | null) => void, playerId: string): () => void {
        console.log('Subscribing to game:', gameId, 'for player:', playerId);
        const gameRef = ref(db, `games/${gameId}`);
        
        // Set initial online status
        this.updatePlayerStatus(gameId, playerId, true).catch(console.error);
        
        const unsubscribe = onValue(gameRef, (snapshot) => {
            const rawState = snapshot.val();
            console.log('Firebase raw update received:', rawState);
            
            const gameState = rawState 
                ? safelyParseGameState(rawState, gameId) 
                : null;
            
            console.log('Processed game state:', gameState);
            callback(gameState);
        });

        this.subscriptions[gameId] = unsubscribe;
        return () => {
            console.log('Unsubscribing from game:', gameId, 'for player:', playerId);
            this.updatePlayerStatus(gameId, playerId, false).catch(console.error);
            off(gameRef);
            delete this.subscriptions[gameId];
        };
    }

    public async getGame(gameId: string): Promise<GameState | null> {
        return await FirebaseService.getGameState(gameId);
    }

    public async getPlayerHand(gameId: string, playerId: string): Promise<Card[]> {
        return await FirebaseService.getPlayerHand(gameId, playerId);
    }

    private async updatePlayerStatus(
        gameId: string, 
        playerId: string, 
        isOnline: boolean
    ): Promise<void> {
        console.log('Updating player status:', { gameId, playerId, isOnline });
        
        if (!gameId || !playerId) {
            console.error('Invalid gameId or playerId');
            return;
        }

        try {
            // Retrieve the current game state
            const gameState = await FirebaseService.getGameState(gameId);
            
            if (!gameState) {
                console.warn('Game not found when updating player status');
                return;
            }

            // Ensure players is always an array
            const players: Player[] = Array.isArray(gameState.players) ? [...gameState.players] : [];
            console.log('Current players:', players);

            // Find the player or create a new player entry if not exists
            const playerIndex = players.findIndex(p => p && p.id === playerId);
            
            if (playerIndex === -1) {
                // Player not found, add a new player
                players.push({
                    id: playerId,
                    name: 'Unknown Player',
                    isInitiator: false,
                    isOnline: isOnline,
                    lastActive: Date.now(),
                    isFinished: false,
                    color: '#9B9B9B', // Default color
                    hand: []
                });
            } else {
                // Update existing player
                players[playerIndex] = {
                    ...players[playerIndex],
                    isOnline,
                    lastActive: Date.now()
                };
            }

            // Create updated game state
            const updatedState: GameState = { 
                ...gameState, 
                players 
            };
        
            console.log('Saving updated game state:', updatedState);
            await FirebaseService.saveGameState(gameId, updatedState);
            console.log('Player status updated successfully');
        } catch (error) {
            console.error('Error updating player status:', error);
        }
    }

    private async updatePlayerHand(
        gameId: string, 
        playerId: string, 
        updatedHand: Card[]
    ): Promise<void> {
        console.log('Updating player hand:', { gameId, playerId, handSize: updatedHand.length });
        
        if (!gameId || !playerId) {
            console.error('Invalid gameId or playerId');
            return;
        }

        try {
            // Retrieve the current game state
            const gameState = await FirebaseService.getGameState(gameId);
            
            if (!gameState) {
                console.warn('Game not found when updating player hand');
                return;
            }

            // Ensure players is always an array
            const players: Player[] = Array.isArray(gameState.players) 
                ? [...gameState.players] 
                : [];
            console.log('Current players:', players);

            // Find the player index
            const playerIndex = players.findIndex(p => p && p.id === playerId);
            
            if (playerIndex === -1) {
                console.error(`Player ${playerId} not found in game state`);
                return;
            }

            // Update the player's hand
            players[playerIndex] = {
                ...players[playerIndex],
                hand: updatedHand
            };

            // Create updated game state
            const updatedState: GameState = { 
                ...gameState, 
                players 
            };
        
            console.log('Saving updated game state with new hand:', updatedState);
            await FirebaseService.saveGameState(gameId, updatedState);
            console.log('Player hand updated successfully');
        } catch (error) {
            console.error('Error updating player hand:', error);
        }
    }

    private dealCards(count: number): Card[] {
        const hand: Card[] = [];
        for (let i = 0; i < count; i++) {
            hand.push({ id: generateUUID(), value: Math.floor(Math.random() * 98) + 2 });
        }
        return hand;
    }

    private getRandomColor(): string {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B9B9B'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

function safelyParseGameState(rawState: any, gameId: string): GameState {
    // Validate and sanitize players
    const players: Player[] = Array.isArray(rawState.players) 
        ? rawState.players.filter((p: any): p is Player => 
            p && 
            typeof p === 'object' && 
            typeof p.id === 'string' &&
            typeof p.name === 'string' &&
            Array.isArray(p.hand)
        )
        : [];

    // Create a safe game state with default values
    return {
        gameId: rawState.gameId || gameId,
        gameStatus: rawState.gameStatus || 'WAITING',
        players,
        currentPlayerIndex: typeof rawState.currentPlayerIndex === 'number' 
            ? rawState.currentPlayerIndex 
            : 0,
        drawPile: Array.isArray(rawState.drawPile) ? rawState.drawPile : [],
        piles: Array.isArray(rawState.piles) 
            ? rawState.piles.map((pile: Partial<Pile>) => ({
                id: pile.id || `pile-${Date.now()}`,
                type: pile.type || 'ASCENDING',
                cards: Array.isArray(pile.cards) ? pile.cards : [],
                preferences: pile.preferences || {},
                displayName: pile.type === 'ASCENDING' ? '↑' : '↓'
            }))
            : createInitialPiles(),
        cardsPlayedThisTurn: typeof rawState.cardsPlayedThisTurn === 'number' 
            ? rawState.cardsPlayedThisTurn 
            : 0,
        initiatorId: rawState.initiatorId || '',
        created: rawState.created || Date.now(),
        selectedCards: Array.isArray(rawState.selectedCards) 
            ? rawState.selectedCards 
            : []
    };
}
