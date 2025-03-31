import React from 'react';
import { Position } from '../types';

interface PlayerPositionProps {
  position: Position;
  isActive?: boolean;
  className?: string;
}

const PlayerPosition: React.FC<PlayerPositionProps> = ({
  position,
  isActive = false,
  className = '',
}) => {
  // Determine styling based on position type
  const isBTN = position.name === 'BTN';
  const isSB = position.name === 'SB';
  const isBB = position.name === 'BB';
  
  // Special styling for button and blinds
  const getPositionStyle = () => {
    if (isActive) {
      // Active position takes precedence over other styles
      return 'bg-gradient-to-r from-teal-600 to-blue-700 text-white ring-2 ring-yellow-300 ring-offset-1 ring-offset-zinc-800 shadow-lg'; 
    } else if (isBTN) {
      return 'bg-gradient-to-r from-red-700 to-red-600 text-white'; 
    } else if (isSB) {
      return 'bg-gradient-to-r from-zinc-700 to-zinc-600 text-zinc-200 ring-2 ring-blue-400 ring-opacity-70'; 
    } else if (isBB) {
      return 'bg-gradient-to-r from-zinc-700 to-zinc-600 text-zinc-200 ring-2 ring-green-400 ring-opacity-70';
    } else {
      return 'bg-zinc-800 text-zinc-300'; // Regular position
    }
  };
  
  // Add position-specific labels for blinds
  const getPositionLabel = () => {
    if (isSB) {
      return (
        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
          S
        </div>
      );
    } else if (isBB) {
      return (
        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
          B
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="flex flex-col items-center transition-all duration-500 ease-in-out">
      <div 
        className={`
          relative flex flex-col items-center justify-center
          ${getPositionStyle()}
          rounded-full p-1 sm:p-1.5
          w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14
          text-xs sm:text-sm
          shadow-md transform transition-all duration-500 ease-in-out hover:scale-105
          ${className}
          ${isActive ? 'scale-110' : ''}
        `}
      >
        {/* Position name */}
        <div className="font-bold">
          {position.displayName}
        </div>
        
        {/* Position-specific label */}
        {getPositionLabel()}
      </div>
    </div>
  );
};

export default PlayerPosition; 