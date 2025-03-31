import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { TableSize, Card, PositionName } from '../types';
import PlayerPosition from './PlayerPosition';
import { getPositionsForTableSize } from '../utils/position';
import CardComponent from './Card';

interface TableProps {
  tableSize: TableSize;
  currentPosition: PositionName;
  currentHand?: Card[] | null;
  fixedHeroPosition?: boolean;
  className?: string;
}

const Table: React.FC<TableProps> = ({
  tableSize,
  currentPosition,
  currentHand = null,
  fixedHeroPosition = false,
  className = '',
}) => {
  // Store previous position for animation
  const prevPositionRef = useRef<PositionName>(currentPosition);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimatingRef = useRef<boolean>(false);
  
  // Get all positions for the table size
  const positions = useMemo(() => getPositionsForTableSize(tableSize), [tableSize]);
  
  // Calculate position styles with animation
  const calculatePositionStyles = useCallback(() => {
    const numPositions = positions.length;
    const styles: React.CSSProperties[] = [];
    
    for (let i = 0; i < numPositions; i++) {
      // Calculate the angle based on position and adjust so that hero is at the bottom
      const heroIndex = positions.findIndex(p => p.name === currentPosition);
      const adjustedIndex = (i - heroIndex + numPositions) % numPositions;
      
      // For fixed hero, always put hero at the bottom (6 o'clock position)
      // Otherwise rotate positions around the table
      const angle = fixedHeroPosition
        ? (adjustedIndex * (2 * Math.PI) / numPositions) + (Math.PI / 2)
        : (i * (2 * Math.PI) / numPositions) - (Math.PI / 2);
      
      // Calculate position on an ellipse
      const x = 50 + 40 * Math.cos(angle);
      const y = 50 + 35 * Math.sin(angle);
      
      // Add some vertical spacing for positions at the top and bottom
      const verticalAdjustment = Math.abs(Math.sin(angle)) > 0.7 ? (Math.sin(angle) > 0 ? 5 : -5) : 0;
      
      styles.push({
        position: 'absolute',
        left: `${x}%`,
        top: `${y + verticalAdjustment}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
        transition: isAnimatingRef.current ? 'all 0.5s ease-in-out' : 'none',
      });
    }
    
    return styles;
  }, [positions, currentPosition, fixedHeroPosition, isAnimatingRef]);
  
  // Position styles with animation
  const positionStyles = useMemo(() => calculatePositionStyles(), 
    [calculatePositionStyles]);
  
  // Handle position transition animation
  useEffect(() => {
    // Only animate if the position changed
    if (prevPositionRef.current !== currentPosition) {
      isAnimatingRef.current = true;
      
      // Clear any existing timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      // Set a timeout to turn off the animation flag after the transition completes
      animationTimeoutRef.current = setTimeout(() => {
        isAnimatingRef.current = false;
      }, 500); // Match duration with CSS transition duration
      
      // Update the ref
      prevPositionRef.current = currentPosition;
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [currentPosition]);
  
  return (
    <div className={`relative w-full max-w-[600px] xl:max-w-[700px] aspect-[3/2] mx-auto ${className}`}>
      {/* The actual poker table itself - circular with no container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Table background with gradient and border */}
        <div className="absolute w-[75%] h-[75%] rounded-full poker-table-shadow" style={{
          background: 'radial-gradient(circle at center, #2d5c3f 0%, #224332 75%, #1a3326 100%)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 5px 20px rgba(0, 0, 0, 0.2), inset 0 2px 20px rgba(255, 255, 255, 0.1)',
          border: '8px solid #11191A'
        }} />
        
        {/* Felt texture overlay */}
        <div className="absolute w-[75%] h-[75%] rounded-full" style={{
          top: 'calc(12.5% + 4px)',
          left: 'calc(12.5% + 4px)',
          right: 'calc(12.5% + 4px)',
          bottom: 'calc(12.5% + 4px)',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          opacity: '0.5',
          mixBlendMode: 'overlay'
        }} />
        
        {/* Table rim highlight */}
        <div className="absolute w-[75%] h-[75%] rounded-full pointer-events-none" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.2) 100%)',
          mixBlendMode: 'overlay'
        }} />
        
        {/* Display user's cards in the middle of the table for all views */}
        {currentHand && currentHand.length >= 2 && (
          <div className="absolute flex flex-col justify-center items-center" style={{ 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 5
          }}>
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 sm:p-2.5 shadow-lg">
              <div className="flex flex-row gap-1.5 sm:gap-2 justify-center items-center">
                {currentHand.map((card, index) => (
                  <div key={index} className="scale-110 xs:scale-115 sm:scale-125 md:scale-135">
                    <CardComponent 
                      card={card}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
              <div className="text-center text-white text-xs sm:text-sm font-medium mt-0.5 sm:mt-1">
                {currentHand[0].rank}{currentHand[1].rank}{currentHand[0].suit === currentHand[1].suit ? 's' : 'o'}
              </div>
            </div>
          </div>
        )}
        
        {/* Player positions */}
        {positions.map((position, index) => (
          <div 
            key={position.id} 
            style={positionStyles[index]} 
            className="transition-all duration-500 ease-in-out"
          >
            <PlayerPosition
              position={position}
              isActive={position.name === currentPosition}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Table; 