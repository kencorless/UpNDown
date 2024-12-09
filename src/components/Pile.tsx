import React from 'react';
import { Card, GameStatus, Player, PreferenceLevel, Pile as PileType } from '../types/game.types';
import './Pile.css';

interface PileProps {
    pile: PileType;
    playerId: string;
    isCurrentPlayer: boolean;
    onCardPlay: (cards: Card[], pileId: string) => void;
    onPreferenceChange: (pileId: string, level: PreferenceLevel) => void;
    players: Player[];
    gameStatus: GameStatus;
}

export const Pile: React.FC<PileProps> = ({
    pile,
    playerId,
    isCurrentPlayer,
    onCardPlay,
    onPreferenceChange,
    players,
    gameStatus,
}) => {
    // Ensure pile.cards is initialized
    const cards = pile.cards || [];
    const topCard = cards.length > 0 ? cards[cards.length - 1] : null;
    const playerPreferences = players.map(player => ({
        playerId: player.id,
        name: player.name,
        preference: (pile.preferences && pile.preferences[player.id]) || 'NONE'
    }));

    return (
        <div className="pile-container">
            <div className="pile-header">
                <span className="pile-type">{pile.type}</span>
                <span className="pile-value">
                    {topCard ? topCard.value : 'Empty'}
                </span>
            </div>

            {!isCurrentPlayer && gameStatus === 'IN_PROGRESS' && (
                <div className="pile-preferences">
                    <button
                        onClick={() => onPreferenceChange(pile.id, 'HIGH')}
                        className={`preference-btn ${pile.preferences?.[playerId] === 'HIGH' ? 'active' : ''}`}
                    >
                        High
                    </button>
                    <button
                        onClick={() => onPreferenceChange(pile.id, 'MEDIUM')}
                        className={`preference-btn ${pile.preferences?.[playerId] === 'MEDIUM' ? 'active' : ''}`}
                    >
                        Medium
                    </button>
                    <button
                        onClick={() => onPreferenceChange(pile.id, 'LOW')}
                        className={`preference-btn ${pile.preferences?.[playerId] === 'LOW' ? 'active' : ''}`}
                    >
                        Low
                    </button>
                </div>
            )}

            {playerPreferences.some(p => p.preference !== 'NONE') && (
                <div className="player-preferences">
                    {playerPreferences.map(({ playerId, name, preference }) => (
                        preference !== 'NONE' && (
                            <div key={playerId} className="player-preference">
                                {name}: {preference}
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );
};
