import React, { useCallback, useEffect, useMemo } from 'react';
import { PlayerNote, PositionName, NoteColor, Position } from '../types';
import PlayerNoteModal from './PlayerNoteModal';
import { getPositionsForTableSize } from '../utils/position';
import { playerNotesService } from '../services/playerNotesService';
import { supabase } from '../lib/supabase';

// Valid note colors for validation
const VALID_NOTE_COLORS: NoteColor[] = ['red', 'yellow', 'green', 'blue', 'purple', 'orange', 'gray', 'black'];

interface NoteData {
  username: string;
  note: string;
  vpipPfr: string;
  color: NoteColor;
}

const PokerTable: React.FC = () => {
  const [playerNotes, setPlayerNotes] = React.useState<Record<string, PlayerNote>>({});
  const [selectedPosition, setSelectedPosition] = React.useState<PositionName | null>(null);
  const [showNoteModal, setShowNoteModal] = React.useState(false);

  // Get all positions for 6-max table
  const positions = useMemo(() => getPositionsForTableSize(6), []);

  const fetchPlayerNotes = useCallback(async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Get all notes from the service
      const notes = await playerNotesService.getUserNotes(user.id);
      // Map them by username
      const notesMap = notes.reduce((acc: Record<string, PlayerNote>, note) => {
        // Ensure the note color is of type NoteColor
        if (VALID_NOTE_COLORS.includes(note.color as NoteColor)) {
          acc[note.username] = {
            ...note,
            color: note.color as NoteColor
          };
        } else {
          console.warn(`Invalid note color for user ${note.username}: ${note.color}`);
        }
        return acc;
      }, {} as Record<string, PlayerNote>);
      
      setPlayerNotes(notesMap);
    } catch (error) {
      console.error('Error fetching player notes:', error);
    }
  }, []);

  // Fetch player notes on mount and when notes change
  useEffect(() => {
    fetchPlayerNotes();
    
    // Set up interval to refresh notes every second
    const interval = setInterval(fetchPlayerNotes, 1000);
    
    return () => clearInterval(interval);
  }, [fetchPlayerNotes]);
  
  // Position-specific data
  const positionData = useMemo(() => {
    // Initialize with empty entries for all positions
    const data: Record<PositionName, { note?: PlayerNote, position: PositionName }> = {
      UTG: { position: 'UTG' },
      UTG1: { position: 'UTG1' },
      UTG2: { position: 'UTG2' },
      LJ: { position: 'LJ' },
      HJ: { position: 'HJ' },
      CO: { position: 'CO' },
      BTN: { position: 'BTN' },
      SB: { position: 'SB' },
      BB: { position: 'BB' }
    };
    
    // Check localStorage for position-to-player mappings
    try {
      const positionMapping = localStorage.getItem('positionPlayerMapping');
      if (positionMapping) {
        const mapping = JSON.parse(positionMapping) as Record<PositionName, string>;
        
        // Apply the mapping
        Object.keys(mapping).forEach(pos => {
          const position = pos as PositionName;
          const username = mapping[position];
          
          if (username && playerNotes[username]) {
            data[position].note = playerNotes[username];
          }
        });
      }
    } catch (error) {
      console.error('Error parsing position mapping:', error);
    }
    
    return data;
  }, [playerNotes]);
  
  // Handler for saving position-player mapping
  const handlePositionPlayerMap = (position: PositionName, username: string) => {
    try {
      const mapping = localStorage.getItem('positionPlayerMapping');
      const positionMapping = mapping ? JSON.parse(mapping) : {};
      
      // Update the mapping
      positionMapping[position] = username;
      
      // Save back to localStorage
      localStorage.setItem('positionPlayerMapping', JSON.stringify(positionMapping));
      
      // Force re-render
      fetchPlayerNotes();
    } catch (error) {
      console.error('Error updating position mapping:', error);
    }
  };

  const handleNoteSaved = async (newNoteData?: NoteData) => {
    // If we have new note data and a selected position, map the player to that position
    if (newNoteData && selectedPosition) {
      handlePositionPlayerMap(selectedPosition, newNoteData.username);
    }
    
    // Refresh notes
    await fetchPlayerNotes();
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
        {positions.map((position: Position) => (
          <div 
            key={position.name}
            className="absolute"
            style={{
              position: 'absolute',
              left: `${50 + 40 * Math.cos((positions.indexOf(position) * 2 * Math.PI) / positions.length - Math.PI / 2)}%`,
              top: `${50 + 35 * Math.sin((positions.indexOf(position) * 2 * Math.PI) / positions.length - Math.PI / 2)}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div 
              className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full bg-zinc-800 text-white cursor-pointer hover:bg-zinc-700 transition-colors"
              onClick={() => {
                setSelectedPosition(position.name);
                setShowNoteModal(true);
              }}
            >
              <span className="font-bold">{position.name}</span>
              {positionData[position.name]?.note && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-white"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <PlayerNoteModal
          isOpen={showNoteModal}
          onClose={() => setShowNoteModal(false)}
          position={selectedPosition || 'UTG'}
          existingUsername={positionData[selectedPosition || 'UTG']?.note?.username}
          onSave={handleNoteSaved}
        />
      )}
    </div>
  );
};

export default PokerTable; 