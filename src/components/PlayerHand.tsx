import React from 'react';
import { Card } from '../types/game.types';
import { useGame } from '../contexts/GameContext';
import './PlayerHand.css';

interface PlayerHandProps {
    cards: Card[];
    selectedCards: string[];
    onCardSelect: (cardId: string) => void;
    isMyTurn: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
    cards,
    selectedCards,
    onCardSelect,
    isMyTurn
}) => {
    const handleCardClick = (cardId: string) => {
        if (!isMyTurn) return;
        onCardSelect(cardId);
    };

    return (
        <div className="player-hand">
            {cards.map(card => (
                <div
                    key={card.id}
                    className={`card ${selectedCards.includes(card.id) ? 'selected' : ''} ${!isMyTurn ? 'disabled' : ''}`}
                    onClick={() => handleCardClick(card.id)}
                >
                    <span className="card-value">{card.value}</span>
                </div>
            ))}
        </div>
    );
};
