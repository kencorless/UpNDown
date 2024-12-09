export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
export type PileType = 'ASCENDING' | 'DESCENDING';

export interface Card {
    id: string;
    value: number;
}

// 8 distinct colors that are visually distinguishable
export const PLAYER_COLORS = [
    '#FF6B6B',  // Coral Red
    '#4ECDC4',  // Turquoise
    '#9B59B6',  // Purple
    '#F7D794',  // Mellow Yellow
    '#45B7D1',  // Sky Blue
    '#96C93D',  // Lime Green
    '#FF8F40',  // Orange
    '#5D6D7E',  // Slate
] as const;

export type PlayerColor = typeof PLAYER_COLORS[number];

export interface Player {
    id: string;
    name: string;
    isInitiator: boolean;
    isOnline: boolean;
    lastActive: number;
    isFinished: boolean;
    color: string;
    hand: Card[];
}

export type PreferenceLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface Pile {
    id: string;
    type: PileType;
    cards: Card[];
    preferences: { [playerId: string]: PreferenceLevel };
    displayName: string;
}

export interface GameState {
    gameId: string;
    gameStatus: GameStatus;
    players: Player[];
    currentPlayerIndex: number;
    drawPile: Card[];
    piles: Pile[];
    cardsPlayedThisTurn: number;
    initiatorId: string;
    created: number;
    selectedCards: string[];
}

export interface GameValidation {
    valid: boolean;
    message?: string;
}

// Helper function to create a pile with the correct type
export function createPile(id: string, type: PileType): Pile {
    return {
        id,
        type,
        cards: [],
        preferences: {},
        displayName: type === 'ASCENDING' ? '↑' : '↓'
    };
}

// Helper function to create initial piles
export function createInitialPiles(): Pile[] {
    return [
        createPile('ascending-1', 'ASCENDING'),
        createPile('ascending-2', 'ASCENDING'),
        createPile('descending-1', 'DESCENDING'),
        createPile('descending-2', 'DESCENDING')
    ];
}
