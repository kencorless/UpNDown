import { Pile, PreferenceLevel, PileType, createPile, Player } from '../types/game.types';

/**
 * PreferenceManager handles the stack preference system in UpNDown.
 * 
 * Game Rules for Preferences:
 * - Players can indicate their interest in playing on specific piles when it's not their turn
 * - There are three levels of preference: like, love, and superlove
 * - Preferences help coordinate team strategy without direct communication
 * - Multiple players can have preferences on the same pile
 * - Players should use superlove sparingly for critical game moments
 */
export class PreferenceManager {
    private static readonly DEFAULT_PREFERENCE: PreferenceLevel = 'NONE';

    /**
     * Safely initializes preferences for a pile
     * @param pile - The pile to initialize preferences for
     * @returns A new pile object with safely initialized preferences
     */
    static initializePilePreferences(pile: Pile): Pile {
        return {
            ...pile,
            preferences: {}
        };
    }

    /**
     * Gets the current preference level for a player on a pile
     * @param pile - The pile to check preferences on
     * @param playerId - The ID of the player to check preferences for
     * @returns The player's current preference level, defaults to 'NONE' if not set
     */
    static getPreference(pile: Pile, playerId: string): PreferenceLevel {
        return pile.preferences[playerId] || 'NONE';
    }

    /**
     * Sets a player's preference for a pile
     * @param pile - The pile to set preference on
     * @param playerId - The ID of the player setting the preference
     * @param level - The preference level to set
     * @returns A new pile object with updated preferences
     */
    static setPreference(pile: Pile, playerId: string, level: PreferenceLevel): Pile {
        const newPreferences = { ...pile.preferences };
        if (level === 'NONE') {
            delete newPreferences[playerId];
        } else {
            newPreferences[playerId] = level;
        }
        return {
            ...pile,
            preferences: newPreferences
        };
    }

    /**
     * Removes a player's preference from a pile
     * @param pile - The pile to remove preferences from
     * @param playerId - The ID of the player whose preferences should be removed
     * @returns A new pile object with the player's preferences removed
     */
    static removePreference(pile: Pile, playerId: string): Pile {
        const newPreferences = { ...pile.preferences };
        delete newPreferences[playerId];
        return {
            ...pile,
            preferences: newPreferences
        };
    }

    /**
     * Gets the count of players with a specific preference level
     * @param pile - The pile to get preference count for
     * @param level - The preference level to count
     * @returns The number of players with the specified preference level
     */
    static getPreferenceCount(pile: Pile, level: PreferenceLevel): number {
        return Object.values(pile.preferences).filter(pref => pref === level).length;
    }

    /**
     * Gets the highest preference level set on a pile
     * @param pile - The pile to get highest preference for
     * @returns The highest preference level set on the pile
     */
    static getHighestPreference(pile: Pile): PreferenceLevel {
        const levels: PreferenceLevel[] = ['HIGH', 'MEDIUM', 'LOW', 'NONE'];
        for (const level of levels) {
            if (this.getPreferenceCount(pile, level) > 0) {
                return level;
            }
        }
        return 'NONE';
    }

    /**
     * Groups players by their preference levels for a given pile
     * @returns An object with players grouped by their preference levels
     */
    static getPlayersByPreference(pile: Pile, players: Player[]): { [key in PreferenceLevel]: Player[] } {
        const result = {
            'NONE': [] as Player[],
            'LOW': [] as Player[],
            'MEDIUM': [] as Player[],
            'HIGH': [] as Player[]
        };

        players.forEach(player => {
            const preference = this.getPreference(pile, player.id);
            result[preference].push(player);
        });

        return result;
    }

    /**
     * Gets all active preferences for a pile
     * @returns An array of active preferences for all players on the pile
     */
    static getActivePlayerPreferences(pile: Pile, players: Player[]): Array<{
        playerId: string;
        name: string;
        level: PreferenceLevel;
    }> {
        return players
            .map(player => ({
                playerId: player.id,
                name: player.name,
                level: this.getPreference(pile, player.id)
            }))
            .filter(pref => pref.level !== 'NONE');
    }

    /**
     * Determines if preferences should be shown for a pile
     * @returns True if preferences should be shown, false otherwise
     */
    static shouldShowPreferences(pile: Pile, player: Player): boolean {
        return !pile.cards.length || this.getPreference(pile, player.id) !== 'NONE';
    }

    /**
     * Clears all preferences from a pile
     * @param pile - The pile to clear preferences from
     * @returns A new pile object with all preferences cleared
     */
    static clearAllPreferences(pile: Pile): Pile {
        return {
            ...pile,
            preferences: {}
        };
    }

    /**
     * Gets the text representation of a preference level
     * @param level - The preference level to get text for
     * @returns The text representation of the preference level
     */
    static getPreferenceText(level: PreferenceLevel): string {
        switch (level) {
            case 'HIGH': return 'Must Play';
            case 'MEDIUM': return 'Should Play';
            case 'LOW': return 'Can Play';
            default: return 'No Preference';
        }
    }

    /**
     * Gets the color associated with a preference level
     * @param level - The preference level to get color for
     * @returns The color associated with the preference level
     */
    static getPreferenceColor(level: PreferenceLevel): string {
        switch (level) {
            case 'HIGH': return '#ff4d4d';
            case 'MEDIUM': return '#ffb84d';
            case 'LOW': return '#4dff4d';
            default: return '#cccccc';
        }
    }

    /**
     * Gets the icon representation of a preference level
     * @param level - The preference level to get icon for
     * @returns The icon representation of the preference level
     */
    static getPreferenceIcon(level: PreferenceLevel): string {
        switch (level) {
            case 'HIGH': return '🔥';
            case 'MEDIUM': return '⭐';
            case 'LOW': return '👍';
            default: return '⚪';
        }
    }

    /**
     * Safely updates preferences for all piles in a game
     */
    static updateGamePiles(piles: Pile[], updateFn: (pile: Pile) => Pile): Pile[] {
        return this.updatePiles(piles, updateFn);
    }

    private static updatePiles(piles: Pile[], updateFn: (pile: Pile) => Pile): Pile[] {
        if (!Array.isArray(piles)) {
            return [];
        }

        return piles.map(pile => {
            if (!pile) {
                return createPile(`pile-${Date.now()}`, 'ASCENDING');
            }
            return updateFn(pile);
        });
    }
}
