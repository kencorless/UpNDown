import { type FC } from 'react';
import { type Pile as PileType } from '../../types/shared';
import { Card } from '../card/Card';
import './Pile.css';

interface PileProps {
  pile: PileType;
  onCardDrop: (cardId: string) => void;
}

export const Pile: FC<PileProps> = ({ pile, onCardDrop }) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    if (cardId) {
      onCardDrop(cardId);
    }
  };

  return (
    <div className="pile-container">
      <div className="pile-label">{pile.label}</div>
      <div
        className="pile"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {pile.cards.length > 0 && (
          <Card
            card={pile.cards[pile.cards.length - 1]}
            draggable={false}
          />
        )}
      </div>
    </div>
  );
};
