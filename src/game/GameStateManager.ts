import { GameState, Player, Pile, Card, PreferenceLevel, PileType, createPile, createInitialPiles } from '../types/game.types';

export class GameStateManager {
    /**
     * Creates a safe copy of the game state with all required properties initialized
     */
    static getSafeGameState(state: GameState): GameState {
        if (!state) {
            console.log('State is null/undefined, returning empty state');
            return {
                gameId: '',
                gameStatus: 'WAITING',
                players: [],
                currentPlayerIndex: 0,
                drawPile: [],
                piles: createInitialPiles(),
                cardsPlayedThisTurn: 0,
                initiatorId: '',
                created: Date.now(),
                selectedCards: []
            };
        }

        const safeState: GameState = {
            gameId: state.gameId || '',
            gameStatus: state.gameStatus || 'WAITING',
            players: this.getSafePlayers(state.players),
            currentPlayerIndex: typeof state.currentPlayerIndex === 'number' ? state.currentPlayerIndex : 0,
            drawPile: Array.isArray(state.drawPile) ? [...state.drawPile] : [],
            piles: this.getSafePiles(state.piles),
            cardsPlayedThisTurn: typeof state.cardsPlayedThisTurn === 'number' ? state.cardsPlayedThisTurn : 0,
            initiatorId: state.initiatorId || '',
            created: state.created || Date.now(),
            selectedCards: Array.isArray(state.selectedCards) ? [...state.selectedCards] : []
        };

        console.log('GameStateManager.getSafeGameState output:', JSON.stringify(safeState, null, 2));
        return safeState;
    }

    /**
     * Creates a safe copy of the players array with all required properties initialized
     */
    static getSafePlayers(players: Player[] | undefined): Player[] {
        console.log('GameStateManager.getSafePlayers input:', JSON.stringify(players, null, 2));
        if (!Array.isArray(players)) {
            console.log('Players is not an array, returning empty array');
            return [];
        }

        const safePlayers = players
            .filter(player => player && typeof player === 'object')
            .map(player => ({
                id: player?.id || '',
                name: player?.name || '',
                hand: Array.isArray(player?.hand) ? [...player.hand] : [],
                isInitiator: Boolean(player?.isInitiator),
                isOnline: Boolean(player?.isOnline),
                lastActive: player?.lastActive || Date.now(),
                isFinished: Boolean(player?.isFinished),
                color: player?.color || '#FF6B6B'
            }));

        console.log('GameStateManager.getSafePlayers output:', JSON.stringify(safePlayers, null, 2));
        return safePlayers;
    }

    /**
     * Creates a safe copy of the piles array with all required properties initialized
     */
    static getSafePiles(piles: Pile[] | undefined): Pile[] {
        console.log('GameStateManager.getSafePiles input:', piles);
        
        if (!Array.isArray(piles)) {
            console.log('Piles is not an array, returning default piles');
            return [];
        }

        const safePiles = piles.map(pile => ({
            ...pile,
            displayName: pile.type === 'ASCENDING' ? '↑' : '↓'
        }));

        console.log('GameStateManager.getSafePiles output:', safePiles);
        return safePiles;
    }

    /**
     * Gets the current player safely
     */
    static getCurrentPlayer(game: GameState): Player {
        console.log('GameStateManager.getCurrentPlayer input:', {
            currentPlayerIndex: game.currentPlayerIndex,
            totalPlayers: game.players?.length
        });

        const safeGame = this.getSafeGameState(game);
        
        if (typeof safeGame.currentPlayerIndex !== 'number' || 
            safeGame.currentPlayerIndex < 0 || 
            !Array.isArray(safeGame.players) || 
            safeGame.currentPlayerIndex >= safeGame.players.length) {
            console.error('Invalid player index or players array:', {
                currentPlayerIndex: safeGame.currentPlayerIndex,
                playersArray: safeGame.players
            });
            throw new Error('Invalid player index');
        }

        const currentPlayer = safeGame.players[safeGame.currentPlayerIndex];
        if (!currentPlayer) {
            console.error('Current player not found at index:', safeGame.currentPlayerIndex);
            throw new Error('Current player not found');
        }

        console.log('GameStateManager.getCurrentPlayer output:', JSON.stringify(currentPlayer, null, 2));
        return currentPlayer;
    }

    /**
     * Updates preferences for a pile safely
     */
    static updatePilePreferences(
        pile: Pile,
        playerId: string,
        level: PreferenceLevel
    ): Pile {
        const safePile = this.getSafePiles([pile])[0];
        return {
            ...safePile,
            preferences: {
                ...safePile.preferences,
                [playerId]: level
            }
        };
    }

    /**
     * Removes all preferences for a player safely
     */
    static removePlayerPreferences(game: GameState, playerId: string): GameState {
        console.log('GameStateManager.removePlayerPreferences input:', {
            playerId,
            pilesCount: game.piles?.length
        });

        const safeGame = this.getSafeGameState(game);
        
        // Safely update each pile's preferences
        const updatedPiles = safeGame.piles.map(pile => {
            const newPreferences = { ...pile.preferences };
            delete newPreferences[playerId];
            return {
                ...pile,
                preferences: newPreferences
            };
        });

        const updatedGame = {
            ...safeGame,
            piles: updatedPiles
        };

        console.log('GameStateManager.removePlayerPreferences output:', {
            pilesCount: updatedGame.piles.length,
            preferencesCount: Object.keys(updatedGame.piles.reduce((count, pile) => ({
                ...count,
                ...pile.preferences
            }), {})).length
        });

        return updatedGame;
    }

    /**
     * Advances to the next player safely
     */
    static advanceToNextPlayer(game: GameState): GameState {
        console.log('GameStateManager.advanceToNextPlayer input:', {
            currentPlayerIndex: game.currentPlayerIndex,
            totalPlayers: game.players?.length
        });

        const safeGame = this.getSafeGameState(game);
        
        // Reset current player's state
        const currentPlayer = this.getCurrentPlayer(safeGame);
        const gameWithoutPreferences = this.removePlayerPreferences(safeGame, currentPlayer.id);
        
        // Calculate next player index with bounds checking
        const totalPlayers = gameWithoutPreferences.players.length;
        if (totalPlayers === 0) {
            throw new Error('No players in game');
        }
        
        const nextPlayerIndex = ((gameWithoutPreferences.currentPlayerIndex + 1) % totalPlayers + totalPlayers) % totalPlayers;
        
        const updatedGame = {
            ...gameWithoutPreferences,
            currentPlayerIndex: nextPlayerIndex,
            cardsPlayedThisTurn: 0
        };

        console.log('GameStateManager.advanceToNextPlayer output:', {
            previousIndex: game.currentPlayerIndex,
            newIndex: updatedGame.currentPlayerIndex,
            totalPlayers
        });

        return updatedGame;
    }

    /**
     * Draws cards for a player safely
     */
    static drawCards(game: GameState, playerId: string, count: number): GameState {
        const safeGame = this.getSafeGameState(game);
        const playerIndex = safeGame.players.findIndex(p => p.id === playerId);
        
        if (playerIndex === -1) {
            throw new Error('Player not found');
        }

        const cardsToDrawCount = Math.min(count, safeGame.drawPile.length);
        const cardsToDraw = safeGame.drawPile.slice(0, cardsToDrawCount);
        const remainingDrawPile = safeGame.drawPile.slice(cardsToDrawCount);

        const updatedPlayers = safeGame.players.map((player, index) => {
            if (index !== playerIndex) return player;
            return {
                ...player,
                hand: [...player.hand, ...cardsToDraw].sort((a, b) => a.value - b.value)
            };
        });

        return {
            ...safeGame,
            players: updatedPlayers,
            drawPile: remainingDrawPile
        };
    }

    static createInitialState(initiator: Player): GameState {
        return {
            gameId: `game-${Date.now()}`,
            gameStatus: 'WAITING',
            players: [initiator],
            currentPlayerIndex: 0,
            drawPile: [],
            piles: createInitialPiles(),
            cardsPlayedThisTurn: 0,
            initiatorId: initiator.id,
            created: Date.now(),
            selectedCards: []
        };
    }

    static addPlayer(state: GameState, player: Player): GameState {
        return {
            ...state,
            players: [...state.players, player]
        };
    }

    static startGame(state: GameState): GameState {
        return {
            ...state,
            gameStatus: 'IN_PROGRESS'
        };
    }

    static isValidPlay(pile: Pile, card: Card): boolean {
        if (pile.cards.length === 0) return true;
        
        const topCard = pile.cards[pile.cards.length - 1];
        
        if (pile.type === 'ASCENDING') {
            return card.value > topCard.value;
        } else {
            return card.value < topCard.value;
        }
    }

    static playCards(state: GameState, playerId: string, cards: Card[], pileId: string): GameState {
        const pile = state.piles.find(p => p.id === pileId);
        if (!pile) throw new Error('Invalid pile');

        const playerIndex = state.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) throw new Error('Player not found');

        const player = state.players[playerIndex];
        const updatedHand = player.hand.filter(card => !cards.some(c => c.id === card.id));

        const updatedPlayers = state.players.map((p, i) => 
            i === playerIndex ? { ...p, hand: updatedHand } : p
        );

        const updatedPiles = state.piles.map(p =>
            p.id === pileId ? { ...p, cards: [...p.cards, ...cards] } : p
        );

        return {
            ...state,
            players: updatedPlayers,
            piles: updatedPiles,
            cardsPlayedThisTurn: (state.cardsPlayedThisTurn || 0) + cards.length
        };
    }

    static updatePreference(state: GameState, playerId: string, pileId: string, level: PreferenceLevel): GameState {
        const updatedPiles = state.piles.map(pile => {
            if (pile.id !== pileId) return pile;
            return {
                ...pile,
                preferences: {
                    ...pile.preferences,
                    [playerId]: level
                }
            };
        });

        return {
            ...state,
            piles: updatedPiles
        };
    }

    static endGame(state: GameState): GameState {
        return {
            ...state,
            gameStatus: 'FINISHED'
        };
    }
}
