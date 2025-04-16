import React, { useState, useEffect } from 'react';
import { TableSize, PositionName, PlayerNote, NoteColor } from '../types';
import { getPositionsForTableSize } from '../utils/position';
import { playerNotesService } from '../services/playerNotesService';
import { supabase } from '../lib/supabase';

// Add mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Check if device has touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check user agent for mobile devices
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      
      setIsMobile(hasTouch && isMobileUA);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

interface PlayerNotesTableProps {
  tableSize: TableSize;
  onOpenNoteModal: (position: PositionName, existingUsername?: string) => void;
  refreshKey?: number;
  onPlayerRemoved?: () => void;
}

interface PositionData {
  name: PositionName;
  playerNote?: PlayerNote;
}

const PlayerNotesTable: React.FC<PlayerNotesTableProps> = ({
  tableSize,
  onOpenNoteModal,
  refreshKey: externalRefreshKey,
  onPlayerRemoved
}) => {
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [hoveredPosition, setHoveredPosition] = useState<PositionName | null>(null);
  const isMobile = useIsMobile();
  
  // Update positions when table size changes or notes are updated
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        // Check authentication status
        const { data: { user } } = await supabase.auth.getUser();

        let notes: PlayerNote[] = [];
        
        if (user) {
          // Fetch notes from Supabase if authenticated
          notes = await playerNotesService.getUserNotes(user.id);
        } else {
          // Fetch notes from localStorage if not authenticated
          const localNotes = localStorage.getItem('playerNotes');
          if (localNotes) {
            notes = JSON.parse(localNotes);
          }
        }
        
        // Make sure notes is an array
        if (!Array.isArray(notes)) {
          console.error('Notes is not an array:', notes);
          return;
        }
        
        // Ensure unique usernames (case-insensitive) by keeping the most recent entry
        const uniqueNotes = notes.reduce((acc, note) => {
          const normalizedUsername = note.username.toLowerCase();
          const existingNote = acc.find(n => n.username.toLowerCase() === normalizedUsername);
          
          if (!existingNote || (note.updated_at && existingNote.updated_at && new Date(note.updated_at) > new Date(existingNote.updated_at))) {
            // Remove existing note if it exists
            if (existingNote) {
              acc = acc.filter(n => n.username.toLowerCase() !== normalizedUsername);
            }
            // Add the new note
            acc.push(note);
          }
          
          return acc;
        }, [] as PlayerNote[]);
        
        const tablePositions = getPositionsForTableSize(tableSize);
        
        // Get position-to-player mappings from localStorage
        let positionMappings: Record<string, string> = {};
        try {
          const storedMappings = localStorage.getItem('positionPlayerMapping');
          if (storedMappings) {
            positionMappings = JSON.parse(storedMappings);
          }
        } catch (error) {
          console.error('Error parsing position mappings:', error);
        }
        
        // Map positions to include any player notes based on mappings
        const positionsWithNotes = tablePositions.map(position => {
          const mappedUsername = positionMappings[position.name];
          const matchingNote = mappedUsername ? 
            uniqueNotes.find(note => note && note.username === mappedUsername) : 
            undefined;
          
          return {
            name: position.name,
            playerNote: matchingNote
          };
        });
        
        setPositions(positionsWithNotes);
      } catch (error) {
        console.error('Error fetching player notes:', error);
      }
    };
    
    fetchNotes();
  }, [tableSize, externalRefreshKey]);
  
  // Handle click on position
  const handleClick = (e: React.MouseEvent, position: PositionName) => {
    e.preventDefault();
    
    // Find if there's an existing player for this position
    const positionMappings = getPositionMappings();
    const existingUsername = positionMappings[position];
    
    onOpenNoteModal(position, existingUsername);
  };
  
  // Get position-to-player mappings from localStorage
  const getPositionMappings = (): Record<string, string> => {
    try {
      const storedMappings = localStorage.getItem('positionPlayerMapping');
      if (storedMappings) {
        return JSON.parse(storedMappings);
      }
    } catch (error) {
      console.error('Error parsing position mappings:', error);
    }
    return {};
  };
  
  // Handle removing a player from a seat
  const handleRemovePlayer = (e: React.MouseEvent, position: PositionName) => {
    e.stopPropagation(); // Prevent opening modal
    
    try {
      // Get current position mappings
      let positionMappings = getPositionMappings();
      
      // Remove the mapping for this position
      delete positionMappings[position];
      localStorage.setItem('positionPlayerMapping', JSON.stringify(positionMappings));
      
      // Update UI
      setPositions(positions.map(pos => {
        if (pos.name === position) {
          return { name: position, playerNote: undefined };
        }
        return pos;
      }));
      
      // Notify parent component
      if (onPlayerRemoved) {
        onPlayerRemoved();
      }
    } catch (error) {
      console.error('Error removing player from seat:', error);
    }
  };
  
  // Handle hover to show notes tooltip
  const handleMouseEnter = (position: PositionName) => {
    setHoveredPosition(position);
  };
  
  const handleMouseLeave = () => {
    setHoveredPosition(null);
  };
  
  // Calculate position styles for the table
  const calculatePositionStyles = () => {
    const numPositions = positions.length;
    const styles: { [key: string]: React.CSSProperties } = {};
    
    for (let i = 0; i < numPositions; i++) {
      // Calculate the angle
      const angle = (i * (2 * Math.PI) / numPositions) - (Math.PI / 2);
      
      // Calculate position on an ellipse
      const x = 50 + 40 * Math.cos(angle);
      const y = 50 + 35 * Math.sin(angle);
      
      // Add some vertical spacing for positions at the top and bottom
      const verticalAdjustment = Math.abs(Math.sin(angle)) > 0.7 ? (Math.sin(angle) > 0 ? 5 : -5) : 0;
      
      styles[positions[i].name] = {
        position: 'absolute',
        left: `${x}%`,
        top: `${y + verticalAdjustment}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
      };
    }
    
    return styles;
  };
  
  const positionStyles = calculatePositionStyles();
  
  // Get background color for position based on player note
  const getPositionColor = (position: PositionData): string => {
    if (!position.playerNote) return 'bg-zinc-800';
    
    // Map the color from the player note to a CSS class
    const colorMap: Record<NoteColor, string> = {
      red: 'bg-red-600',
      yellow: 'bg-yellow-500',
      green: 'bg-green-600',
      blue: 'bg-blue-600',
      purple: 'bg-purple-600',
      orange: 'bg-orange-500',
      gray: 'bg-gray-500',
      black: 'bg-black'
    };
    
    return colorMap[position.playerNote.color] || 'bg-zinc-800';
  };
  
  // Generate tooltip content for player note
  const getTooltipContent = (position: PositionName) => {
    const positionData = positions.find(p => p.name === position);
    if (!positionData || !positionData.playerNote) return null;
    
    const playerNote = positionData.playerNote;
    return (
      <div className="bg-zinc-900 text-white p-3 rounded-md shadow-lg max-w-xs mb-2 border border-zinc-700">
        <div className="font-bold border-b border-zinc-700 pb-1 mb-2">
          {playerNote.username}
          {playerNote.vpip_pfr && (
            <span className="ml-2 font-mono text-sm">{playerNote.vpip_pfr}</span>
          )}
        </div>
        <div className="text-sm whitespace-pre-wrap">
          {playerNote.note || 'No notes added'}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-[600px] aspect-[3/2] mx-auto">
      {/* The poker table */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Table background with gradient and border */}
        <div className="absolute w-[75%] h-[75%] rounded-full" style={{
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
        
        {/* Player positions */}
        {positions.map((position) => (
          <div 
            key={position.name} 
            style={positionStyles[position.name]}
            className="relative"
            onClick={(e) => handleClick(e, position.name)}
            onMouseEnter={() => handleMouseEnter(position.name)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex flex-col items-center">
              {/* Player name and VPIP/PFR display - conditionally positioned based on table position */}
              {position.playerNote && (
                <div 
                  className={`text-center text-white text-xs sm:text-sm whitespace-nowrap bg-black/70 px-2 py-1 rounded shadow-md z-20 ${
                    (tableSize === 8 && position.name === 'CO') || (tableSize === 6 && position.name === 'BTN')
                      ? 'mb-2' 
                      : 'absolute top-[105%]'
                  }`}
                  style={{ minWidth: '70px' }}
                >
                  <div className="font-medium flex items-center gap-1 relative">
                    {position.playerNote.username}
                    {/* Remove button - visible on hover */}
                    {!isMobile && hoveredPosition === position.name && (
                      <button
                        className="absolute -right-5 -top-1 w-5 h-5 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white text-xs"
                        onClick={(e) => handleRemovePlayer(e, position.name)}
                        title="Remove player from seat"
                      >
                        ×
                      </button>
                    )}
                    {/* Info icon for mobile - only visible on mobile devices */}
                    {isMobile && (
                      <div className="flex items-center gap-1">
                        <button 
                          className="text-xs bg-zinc-700 rounded-full w-4 h-4 flex items-center justify-center hover:bg-zinc-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHoveredPosition(position.name);
                          }}
                        >
                          i
                        </button>
                        <button 
                          className="text-xs bg-red-600 rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-700"
                          onClick={(e) => handleRemovePlayer(e, position.name)}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  {position.playerNote.vpip_pfr && (
                    <div className="text-xs font-mono mt-0.5">
                      {position.playerNote.vpip_pfr}
                    </div>
                  )}
                </div>
              )}
              
              <div 
                className={`
                  relative flex flex-col items-center justify-center
                  ${getPositionColor(position)}
                  rounded-full p-1 sm:p-1.5
                  w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14
                  text-xs sm:text-sm text-white
                  shadow-md cursor-pointer
                  transition-all duration-200 ease-in-out hover:scale-110
                `}
              >
                {/* Show "Open Seat" if no player is assigned */}
                <div className="font-bold text-[10px] sm:text-xs text-center w-full px-0.5 flex items-center justify-center h-full">
                  {!position.playerNote ? 'Open Seat' : ''}
                </div>
                
                {/* User indicator if there's a note */}
                {position.playerNote && (
                  <div className="absolute -bottom-1 -right-1 bg-white w-3 h-3 rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Tooltip container - only show on desktop */}
        {hoveredPosition && positions.find(p => p.name === hoveredPosition)?.playerNote && !isMobile && (
          <div 
            className="absolute z-50 pointer-events-none"
            style={{
              top: `${positionStyles[hoveredPosition].top}`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-60px',
              maxWidth: 'min(90vw, 300px)',
              width: 'auto',
              minWidth: '200px',
              maxHeight: '30vh',
              overflowY: 'auto',
              left: `clamp(150px, ${positionStyles[hoveredPosition].left}, calc(100vw - 150px))`
            }}
          >
            {getTooltipContent(hoveredPosition)}
          </div>
        )}

        {/* Mobile note modal - only show on mobile */}
        {hoveredPosition && positions.find(p => p.name === hoveredPosition)?.playerNote && isMobile && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
            onClick={() => setHoveredPosition(null)}
          >
            <div 
              className="w-full max-w-sm bg-zinc-900 text-white p-4 rounded-lg shadow-lg border border-zinc-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold">Player Note</h3>
                <button 
                  className="text-zinc-400 hover:text-white"
                  onClick={() => setHoveredPosition(null)}
                >
                  ✕
                </button>
              </div>
              {getTooltipContent(hoveredPosition)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerNotesTable; 