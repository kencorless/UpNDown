/**
 * PilePreferences Component
 * 
 * This component provides the UI for players to indicate their interest in playing
 * on specific piles when it's not their turn. The preference system is a key
 * strategic element in UpNDown, allowing players to:
 * 
 * 1. Signal to teammates which piles they have good cards for
 * 2. Coordinate moves without direct communication
 * 3. Plan ahead for future turns
 * 
 * Preference Levels:
 * - Like (👍): Basic interest, "I could play here if needed"
 * - Love (❤️): Strong interest, "I have good cards for this pile"
 * - Superlove (💖): Critical interest, "I have perfect cards, please make this possible!"
 */

import React from 'react';
import { PreferenceLevel, Pile } from '../types/game.types';
import { PreferenceIcon } from './PreferenceIcon';
import './PilePreferences.css';

interface PilePreferencesProps {
    pile: Pile;
    playerId: string;
    onPreferenceChange: (pileId: string, level: PreferenceLevel) => void;
}

export const PilePreferences: React.FC<PilePreferencesProps> = ({
    pile,
    playerId,
    onPreferenceChange,
}) => {
    const currentPreference = pile.preferences[playerId] || 'NONE';

    const handlePreferenceClick = (level: PreferenceLevel) => {
        onPreferenceChange(pile.id, level);
    };

    return (
        <div className="pile-preferences">
            <button
                className={`preference-btn ${currentPreference === 'HIGH' ? 'active' : ''}`}
                onClick={() => handlePreferenceClick('HIGH')}
                title="High Priority"
            >
                <PreferenceIcon level="HIGH" size="small" />
            </button>
            <button
                className={`preference-btn ${currentPreference === 'MEDIUM' ? 'active' : ''}`}
                onClick={() => handlePreferenceClick('MEDIUM')}
                title="Medium Priority"
            >
                <PreferenceIcon level="MEDIUM" size="small" />
            </button>
            <button
                className={`preference-btn ${currentPreference === 'LOW' ? 'active' : ''}`}
                onClick={() => handlePreferenceClick('LOW')}
                title="Low Priority"
            >
                <PreferenceIcon level="LOW" size="small" />
            </button>
            <button
                className={`preference-btn ${currentPreference === 'NONE' ? 'active' : ''}`}
                onClick={() => handlePreferenceClick('NONE')}
                title="No Preference"
            >
                <PreferenceIcon level="NONE" size="small" />
            </button>
        </div>
    );
};
