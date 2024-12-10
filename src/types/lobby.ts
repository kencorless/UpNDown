// Re-export shared types
export * from './shared';

export interface Player {
    id: string;
    name: string;
    isReady: boolean;
    isHost: boolean;
    joinedAt: number;
}

export interface GameLobby {
    id: string;
    hostId: string;
    players: Record<string, Player>;
    status: 'waiting' | 'starting' | 'in_progress';
    createdAt: number;
    maxPlayers: number;
}

export type LobbyStatus = 'creating' | 'joining' | 'waiting' | 'ready' | 'error';
