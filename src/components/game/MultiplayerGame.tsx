import { type FC } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { Card } from '../card/Card';
import { Pile } from '../pile/Pile';
import { DrawPile } from '../pile/DrawPile';

export const MultiplayerGame: FC = () => {
  const { gameState, playCard, drawCard } = useGameState();

  if (!gameState || gameState.gameMode !== 'multiplayer') {
    return null;
  }

  const currentPlayer = gameState.players[gameState.currentPlayer];
  
  const handleCardDrop = (pileId: string) => (cardId: string): void => {
    const cardIndex = currentPlayer.hand.findIndex((c) => c.id === cardId);
    if (cardIndex !== -1) {
      playCard(cardIndex, pileId);
    }
  };

  return (
    <div className="game-board">
      <div className="foundation-piles">
        <div className="foundation-piles-left">
          {gameState.foundationPiles.slice(0, 2).map((pile) => (
            <Pile
              key={pile.id}
              pile={pile}
              onCardDrop={handleCardDrop(pile.id)}
            />
          ))}
        </div>
        <div className="foundation-piles-right">
          {gameState.foundationPiles.slice(2).map((pile) => (
            <Pile
              key={pile.id}
              pile={pile}
              onCardDrop={handleCardDrop(pile.id)}
            />
          ))}
        </div>
      </div>

      <div className="player-hand">
        {currentPlayer.hand.map((card) => (
          <Card
            key={card.id}
            card={card}
            draggable
          />
        ))}
      </div>

      <DrawPile
        count={gameState.drawPile.length}
        onClick={drawCard}
      />

      <div className="game-info">
        <div className="turn-info">
          Cards played this turn: {gameState.cardsPlayedThisTurn} / {gameState.minCardsPerTurn}
        </div>
        <div className="player-info">
          Current player: {currentPlayer.name}
        </div>
      </div>
    </div>
  );
};