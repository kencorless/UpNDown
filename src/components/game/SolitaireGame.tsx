import { type FC, useEffect } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { Card } from '../card/Card';
import { CardPile } from '../CardPile';
import './SolitaireGame.css';

export const SolitaireGame: FC = () => {
  const { gameState, playCard, initializeGame } = useGameState();

  useEffect(() => {
    if (!gameState) {
      console.log('Initializing new solitaire game');
      initializeGame('player1', 'Player 1');
    }
  }, [gameState, initializeGame]);

  if (!gameState || gameState.gameMode !== 'solitaire') {
    return <div className="loading">Loading game...</div>;
  }

  const player = gameState.players[0];
  
  const handleCardDrop = (pileId: string) => (cardId: string): void => {
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex !== -1) {
      console.log(`Attempting to play card ${cardId} on pile ${pileId}`);
      playCard(cardIndex, pileId);
    }
  };

  return (
    <div className="solitaire-game">
      {gameState.gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-message">
            <h2>Game Over</h2>
            <p>No more valid moves available!</p>
            <button 
              className="new-game-button"
              onClick={() => initializeGame('player1', 'Player 1')}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      <h1 className="game-title">Up-n-Down Solitaire</h1>

      <div className="foundation-piles">
        {gameState.foundationPiles.map((pile) => (
          <CardPile
            key={pile.id}
            pile={pile}
            onCardDrop={handleCardDrop(pile.id)}
          />
        ))}
      </div>

      <div className="draw-pile-counter">
        {gameState.drawPile.length}
      </div>

      <div className="hand-section">
        <div className="hand-cards">
          {player.hand.map((card) => (
            <Card
              key={card.id}
              card={card}
              draggable={true}
              onClick={() => {
                console.log('Card clicked:', card);
              }}
            />
          ))}
        </div>
        <h3 className="hand-label">Your Hand ({player.hand.length} cards)</h3>
      </div>
    </div>
  );
};