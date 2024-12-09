import { GameEngine } from './GameEngine';
import { GameState, Card } from '../types/game.types';
import { getApp } from 'firebase/app';
import { getDatabase, goOffline } from 'firebase/database';

describe('GameEngine', () => {
    let game: GameEngine;
    let gameId: string;
    let player1Id: string;

    beforeEach(async () => {
        game = new GameEngine();
        const result = await game.createGame('Player 1');
        gameId = result.gameId;
        player1Id = result.playerId;
    });

    afterAll(async () => {
        // Close the database connection
        const database = getDatabase();
        await goOffline(database);
    });

    test('creates game with initial state', async () => {
        const state = await game.getGameState(gameId);
        expect(state).toBeTruthy();
        expect(state?.gameStatus).toBe('WAITING');
        expect(state?.players).toHaveLength(1);
        expect(state?.players[0].name).toBe('Player 1');
    });

    test('allows players to join', async () => {
        const player2 = await game.joinGame(gameId, 'Player 2');
        const state = await game.getGameState(gameId);
        
        expect(state?.players).toHaveLength(2);
        expect(player2.name).toBe('Player 2');
        expect(player2.isInitiator).toBe(false);
    });

    test('starts game correctly', async () => {
        await game.joinGame(gameId, 'Player 2');
        await game.startGame(gameId);

        const state = await game.getGameState(gameId);
        expect(state?.gameStatus).toBe('IN_PROGRESS');
        expect(state?.drawPile.length).toBeGreaterThan(0);
    });

    test('validates card plays', async () => {
        await game.joinGame(gameId, 'Player 2');
        await game.startGame(gameId);

        const state = await game.getGameState(gameId);
        if (!state) throw new Error('Game state not found');
        
        const pile = state.piles[0];
        const testCard1: Card = { id: 'test-1', value: 50 };
        const testCard2: Card = { id: 'test-2', value: 1 };

        expect(await game.validateCardPlay(gameId, pile.id, testCard1)).toBe(true);
        expect(await game.validateCardPlay(gameId, pile.id, testCard2)).toBe(false);
    });

    test('handles end turn correctly', async () => {
        await game.joinGame(gameId, 'Player 2');
        await game.startGame(gameId);
        await game.endTurn(gameId, player1Id);

        const state = await game.getGameState(gameId);
        expect(state?.currentPlayerIndex).toBe(1);
    });

    test('handles game completion', async () => {
        await game.joinGame(gameId, 'Player 2');
        await game.startGame(gameId);

        // Simulate playing all cards
        const state = await game.getGameState(gameId);
        if (!state) throw new Error('Game state not found');

        const player = state.players[0];
        for (const card of player.hand) {
            await game.playCards(gameId, player1Id, [card], state.piles[0].id);
        }

        expect(state.players[0].hand.length).toBe(0);
        expect(await game.isGameOver(gameId)).toBe(true);
    });
});
