import { type FC } from 'react';
import { type Card as CardType } from '../../types/shared';
import './Card.css';

interface CardProps {
  card: CardType;
  draggable?: boolean;
  onClick?: () => void;
}

export const Card: FC<CardProps> = ({ card, draggable = false, onClick }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('cardId', card.id);
  };

  return (
    <div
      className="card"
      draggable={draggable}
      onDragStart={handleDragStart}
      onClick={onClick}
    >
      {card.value}
    </div>
  );
};
