/**
 * Card Component
 * 
 * A reusable React component that renders a playing card with customizable properties.
 * Supports different sizes (sm, md, lg) and can display cards face up or face down.
 * 
 * Features:
 * - Responsive sizing with different dimensions for mobile and desktop
 * - Color-coded suits (red for hearts/diamonds, black for spades/clubs)
 * - Customizable face up/down state
 * - Smooth transitions and hover effects
 * - Subtle card texture background
 */

import React from 'react';
import { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  faceUp?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Card: React.FC<CardProps> = ({
  card,
  faceUp = true,
  size = 'md',
  className = '',
}) => {
  const { rank, suit } = card;
  
  // Size classes - increased for better visibility
  const sizeClasses = {
    sm: 'w-10 h-14 sm:w-12 sm:h-16',
    md: 'w-14 h-20 sm:w-16 sm:h-24',
    lg: 'w-20 h-28 sm:w-24 sm:h-32',
  };
  
  // Get card class based on suit color
  const suitColor = suit === 'h' || suit === 'd' ? 'text-red-600' : 'text-zinc-800';
  
  // Helper function to get suit symbol
  const getSuitSymbol = (suit: string) => {
    switch(suit) {
      case 's': return '♠';
      case 'h': return '♥';
      case 'd': return '♦';
      case 'c': return '♣';
      default: return '';
    }
  };
  
  // Render card back if not face up
  if (!faceUp) {
    return (
      <div className={`card bg-blue-800 ${sizeClasses[size]} ${className} rounded-md transition-all duration-300 ease-in-out`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-3/4 h-3/4 bg-white/10 rounded-sm flex items-center justify-center">
            <span className="text-white font-bold">PT</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Suit symbol
  const suitSymbol = getSuitSymbol(suit);
  
  // Determine font sizes based on card size
  const rankFontSize = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  };
  
  return (
    <div className={`card bg-white ${sizeClasses[size]} ${className} relative rounded-md border border-zinc-300 shadow-sm transition-all duration-300 ease-in-out`}>
      {/* Top-left corner with rank */}
      <div className="absolute top-0.5 left-1">
        <span className={`font-bold ${suitColor} ${rankFontSize[size]}`}>{rank}</span>
      </div>
      
      {/* Bottom-right corner suit symbol */}
      <div className="absolute bottom-0.5 right-1">
        <span className={`${suitColor} ${rankFontSize[size]} font-bold`}>{suitSymbol}</span>
      </div>
      
      {/* Background pattern to give the card texture */}
      <div className="absolute inset-0 rounded-md opacity-5 pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 50% 50%, #000 1px, transparent 1px)', 
          backgroundSize: '10px 10px' 
        }}>
      </div>
    </div>
  );
};

export default Card; 