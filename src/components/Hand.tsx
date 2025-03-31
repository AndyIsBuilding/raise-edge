import React, { useEffect, useState } from 'react';
import { Card as CardType } from '../types';
import Card from './Card';

interface HandProps {
  cards: CardType[];
  faceUp?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const Hand: React.FC<HandProps> = ({
  cards,
  faceUp = true,
  size = 'md',
  showName = false,
  className = '',
}) => {
  // Track animation state
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animate when cards change
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [cards]);
  
  // Ensure we have at least 2 cards
  if (cards.length < 2) {
    return null;
  }
  
  const card1 = cards[0];
  const card2 = cards[1];
  
  // Generate hand name (e.g., "AKs" for suited Ace-King)
  const isSuited = card1.suit === card2.suit;
  const handName = `${card1.rank}${card2.rank}${isSuited ? 's' : 'o'}`;
  
  // Animation classes
  const animationClass = isAnimating 
    ? 'opacity-0 scale-95 transform' 
    : 'opacity-100 scale-100 transform';
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`flex flex-row gap-3 transition-all duration-300 ease-out ${animationClass}`}>
        <Card card={card1} faceUp={faceUp} size={size} />
        <Card card={card2} faceUp={faceUp} size={size} />
      </div>
      
      {showName && faceUp && (
        <div className={`mt-1 text-center font-semibold text-sm sm:text-base transition-all duration-300 ease-out ${animationClass}`}>
          {handName}
        </div>
      )}
    </div>
  );
};

export default Hand; 