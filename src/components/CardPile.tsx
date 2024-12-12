import React from 'react';
import { type Pile, COLORS } from '../types/gameTypes';
import './CardPile.css';

interface CardPileProps {
  pile: Pile;
  onCardDrop?: (cardId: string) => void;
}

export const CardPile: React.FC<CardPileProps> = ({ pile, onCardDrop }) => {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (onCardDrop) {
      const cardId = e.dataTransfer.getData('cardId');
      console.log('Receiving card:', cardId, 'on pile:', pile.id);
      onCardDrop(cardId);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Generate styles using constants
  const pileStyle = {
    backgroundColor: pile.type === 'UP' ? COLORS.ASCENDING_PILE : COLORS.DESCENDING_PILE
  };

  const insetStyle = {
    background: `linear-gradient(to bottom right, ${COLORS.INSET_GRADIENT_START}, ${COLORS.INSET_GRADIENT_END})`
  };

  return (
    <div 
      className={`card-pile ${pile.type.toLowerCase()}`}
      style={pileStyle}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="inset-area" style={insetStyle}>
        {pile.cards.length > 0 ? (
          <div className="top-card">
            {pile.cards[pile.cards.length - 1].value}
          </div>
        ) : null}
      </div>
    </div>
  );
};