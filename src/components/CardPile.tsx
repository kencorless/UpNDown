import React from 'react';
import { type Pile } from '../types/shared';
import { COLORS, FOUNDATION_PILE_DIMENSIONS } from '../types/gameTypes.ts';
import './CardPile.css';

interface CardPileProps {
  pile: Pile;
  onCardDrop?: (cardId: string) => void;
}

export const CardPile: React.FC<CardPileProps> = ({ pile, onCardDrop }) => {
  // Generate styles using constants
  const pileStyle = {
    width: `${FOUNDATION_PILE_DIMENSIONS.WIDTH}px`,
    height: `${FOUNDATION_PILE_DIMENSIONS.HEIGHT}px`,
    borderRadius: `${FOUNDATION_PILE_DIMENSIONS.BORDER_RADIUS}px`,
    backgroundColor: pile.type === 'UP' ? COLORS.ASCENDING_PILE : COLORS.DESCENDING_PILE
  };

  const insetStyle = {
    width: `${FOUNDATION_PILE_DIMENSIONS.INSET_WIDTH_PERCENTAGE}%`,
    height: `${FOUNDATION_PILE_DIMENSIONS.INSET_HEIGHT_PERCENTAGE}%`,
    background: `linear-gradient(to bottom right, ${COLORS.INSET_GRADIENT_START}, ${COLORS.INSET_GRADIENT_END})`
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (onCardDrop) {
      const cardId = e.dataTransfer.getData('cardId');
      onCardDrop(cardId);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div 
      className={`card-pile ${pile.type.toLowerCase()}`}
      style={pileStyle}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="inset-area" style={insetStyle}>
        {pile.cards.length > 0 && (
          <div className="top-card">
            {pile.cards[pile.cards.length - 1].value}
          </div>
        )}
      </div>
    </div>
  );
};