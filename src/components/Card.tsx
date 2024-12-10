import { type FC } from 'react';
import { type Card as CardType } from '../types/shared';
import './Card.css';

interface CardProps {
  card: CardType;
  draggable?: boolean;
  onClick?: (card: CardType) => void;
}

export const Card: FC<CardProps> = ({ card, draggable = false, onClick }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('Starting drag for:', card.id);
    // Set a simple ID as the drag data
    e.dataTransfer.setData('cardId', card.id);
  };

  return (
    <div
      className="card"
      draggable={draggable}
      onDragStart={handleDragStart}
      onClick={() => onClick?.(card)}
    >
      {card.value}
    </div>
  );
};