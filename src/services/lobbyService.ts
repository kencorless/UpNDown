import { database } from '../config/firebase';
import { 
    ref, 
    set, 
    get, 
    update,
    onValue,
    off,
    child,
    runTransaction
} from 'firebase/database';
import { type Player } from '../types/shared';
import { dealMultiplayerHands, createDeck } from '../utils/gameUtils';

interface GameLobby {
    id: string;
    host: string;
    players: Record<string, Player>;
    status: 'waiting' | 'ready' | 'starting' | 'in_progress';
    createdAt: number;
    maxPlayers: number;
}

const LOBBY_PATH = 'lobbies';
const MAX_PLAYERS = 4;

const debugDatabase = async (path: string) => {
    try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, path));
        console.log(`Database content at ${path}:`, snapshot.val());
    } catch (error) {
        console.error(`Error reading database at ${path}:`, error);
    }
};

export const generateGameId = (): string => {
    // Generate a 6-character game code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

export const createLobby = async (hostId: string, hostName: string): Promise<string> => {
    try {
        console.log('Creating lobby with host:', { hostId, hostName });
        const gameId = generateGameId();
        
        const hostPlayer: Player = {
            id: hostId,
            name: hostName || 'Host',
            isReady: false,
            isHost: true,
            joinedAt: Date.now(),
            cardCount: 0,
            hand: []
        };
        
        const lobby: GameLobby = {
            id: gameId,
            host: hostId,
            players: {
                [hostId]: hostPlayer
            },
            status: 'waiting',
            createdAt: Date.now(),
            maxPlayers: MAX_PLAYERS
        };

        console.log('Writing to database path:', `${LOBBY_PATH}/${gameId}`);
        const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
        
        // Check if the game ID already exists
        const snapshot = await get(lobbyRef);
        if (snapshot.exists()) {
            console.log('Game ID collision, generating new ID');
            return createLobby(hostId, hostName);
        }

        await set(lobbyRef, lobby);
        console.log('Successfully created lobby:', lobby);
        
        // Verify the lobby was created
        await debugDatabase(`${LOBBY_PATH}/${gameId}`);
        
        return gameId;
    } catch (error) {
        console.error('Error creating lobby:', error);
        throw error;
    }
};

export const joinLobby = async (gameId: string, playerId: string, playerName: string): Promise<void> => {
    try {
        console.log('Attempting to join lobby:', { gameId, playerId, playerName });
        const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
        
        // First check if the lobby exists
        const snapshot = await get(lobbyRef);
        console.log('Initial lobby check - exists:', snapshot.exists(), 'value:', snapshot.val());
        
        if (!snapshot.exists()) {
            throw new Error(`Game not found: ${gameId}`);
        }

        const currentData = snapshot.val() as GameLobby;
        
        // Check if player is already in the lobby
        if (currentData.players[playerId]) {
            console.log('Player already in lobby, updating name if changed');
            if (currentData.players[playerId].name !== playerName) {
                await update(ref(database, `${LOBBY_PATH}/${gameId}/players/${playerId}`), {
                    name: playerName
                });
            }
            return;
        }

        // Check if lobby is full
        const currentPlayerCount = Object.keys(currentData.players).length;
        if (currentPlayerCount >= MAX_PLAYERS) {
            throw new Error('Game is full');
        }

        // Add new player
        const newPlayer: Player = {
            id: playerId,
            name: playerName,
            isReady: false,
            isHost: false,
            joinedAt: Date.now(),
            cardCount: 0,
            hand: []
        };

        await update(ref(database, `${LOBBY_PATH}/${gameId}/players/${playerId}`), newPlayer);
        console.log('Successfully added player to lobby:', newPlayer);

    } catch (error) {
        console.error('Error joining lobby:', error);
        throw error;
    }
};

export const leaveLobby = async (gameId: string, playerId: string): Promise<void> => {
    try {
        console.log('Player leaving lobby:', { gameId, playerId });
        const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
        
        await runTransaction(lobbyRef, (currentData: GameLobby | null) => {
            if (!currentData) {
                console.log('No lobby found to leave');
                return null;
            }

            // Remove the player
            const { [playerId]: removedPlayer, ...remainingPlayers } = currentData.players;
            
            // If no players left, remove the lobby
            if (Object.keys(remainingPlayers).length === 0) {
                console.log('No players left, removing lobby');
                return null;
            }

            // If the leaving player was the host, assign a new host
            if (removedPlayer?.isHost) {
                const newHostId = Object.keys(remainingPlayers)[0];
                remainingPlayers[newHostId].isHost = true;
                currentData.host = newHostId;
            }

            currentData.players = remainingPlayers;
            return currentData;
        });

        console.log('Successfully processed player leaving lobby');

    } catch (error) {
        console.error('Error leaving lobby:', error);
        throw error;
    }
};

export const setPlayerReady = async (gameId: string, playerId: string, isReady: boolean): Promise<void> => {
    try {
        console.log('Setting player ready status:', { gameId, playerId, isReady });
        const playerRef = ref(database, `${LOBBY_PATH}/${gameId}/players/${playerId}`);
        
        await runTransaction(playerRef, (currentData: Player | null) => {
            if (!currentData) return null;
            return { ...currentData, isReady };
        });

    } catch (error) {
        console.error('Error setting player ready status:', error);
        throw error;
    }
};

export const startGame = async (gameId: string, playerId: string): Promise<void> => {
    try {
        console.log('Starting game:', { gameId, playerId });
        const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
        
        await runTransaction(lobbyRef, (currentData: GameLobby | null) => {
            if (!currentData) {
                throw new Error('Game not found');
            }

            // Verify the player is the host
            if (currentData.host !== playerId) {
                throw new Error('Only the host can start the game');
            }

            // Check if all players are ready
            const allPlayersReady = Object.values(currentData.players).every(p => p.isReady);
            if (!allPlayersReady) {
                throw new Error('Not all players are ready');
            }

            // Initialize the game state
            const playerIds = Object.keys(currentData.players);
            const initialDeck = createDeck();
            const { player1Hand, player2Hand } = dealMultiplayerHands(initialDeck);

            // Update player hands
            playerIds.forEach((id, index) => {
                if (currentData.players[id]) {
                    currentData.players[id].hand = index === 0 ? player1Hand : player2Hand;
                    currentData.players[id].cardCount = currentData.players[id].hand.length;
                }
            });

            // Update game status
            currentData.status = 'starting';
            
            return currentData;
        });

        console.log('Successfully started game');

    } catch (error) {
        console.error('Error starting game:', error);
        throw error;
    }
};

export const subscribeLobby = (gameId: string, callback: (lobby: GameLobby | null) => void): (() => void) => {
    console.log('Setting up lobby subscription:', gameId);
    const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);

    const onLobbyUpdate = (snapshot: any) => {
        const data = snapshot.val();
        console.log('Lobby update received:', data);
        callback(data);
    };

    onValue(lobbyRef, onLobbyUpdate);

    return () => {
        console.log('Cleaning up lobby subscription');
        off(lobbyRef, 'value', onLobbyUpdate);
    };
};
