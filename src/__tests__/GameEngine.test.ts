import { GameEngine } from '../game/GameEngine';
import { Card, GameState, Player } from '../types/game.types';

describe('GameEngine', () => {
    let game: GameEngine;
    let gameId: string;
    let playerId: string;

    beforeEach(async () => {
        game = new GameEngine();
        const result = await game.createGame('Player 1');
        gameId = result.gameId;
        playerId = result.player.id;
    });

    test('creates game with initial state', async () => {
        const state = await game.getGameState();
        expect(state).toBeTruthy();
        expect(state?.gameStatus).toBe('WAITING');
        expect(state?.players).toHaveLength(1);
        expect(state?.players[0].name).toBe('Player 1');
        expect(state?.players[0].hand).toHaveLength(0);
    });

    test('allows players to join', async () => {
        const player2 = await game.joinGame(gameId, 'Player 2');
        const state = await game.getGameState();
        
        expect(state?.players).toHaveLength(2);
        expect(player2.name).toBe('Player 2');
        expect(player2.hand).toHaveLength(0);
    });

    test('starts game with valid number of players', async () => {
        await game.joinGame(gameId, 'Player 2');
        await game.startGame(gameId);

        const state = await game.getGameState();
        expect(state?.gameStatus).toBe('IN_PROGRESS');
        expect(state?.players[0].hand).toHaveLength(0); // Hands start empty
        expect(state?.players[1].hand).toHaveLength(0);
    });

    test('validates card plays correctly', async () => {
        await game.joinGame(gameId, 'Player 2');
        await game.startGame(gameId);

        const state = await game.getGameState();
        if (!state) throw new Error('Game state not found');
        
        const pile = state.piles[0];
        if (!pile) throw new Error('Pile not found');

        // Test playing a higher card on ascending pile
        const validPlay = await game.isValidPlay(gameId, pile, { id: 'test-1', value: 50 });
        expect(validPlay).toBe(true);
        
        // Test playing an invalid card
        const invalidPlay = await game.isValidPlay(gameId, pile, { id: 'test-2', value: 1 });
        expect(invalidPlay).toBe(false);
    });
});
