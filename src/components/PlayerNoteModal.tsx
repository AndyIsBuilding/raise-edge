import React, { useState, useEffect } from 'react';
import { PositionName, PlayerNote, NoteColor } from '../types';
import { playerNotesService } from '../services/playerNotesService';
import { supabase } from '../lib/supabase';

interface PlayerNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: PositionName;
  existingUsername?: string;
  onSave: () => void;
}

const PlayerNoteModal: React.FC<PlayerNoteModalProps> = ({
  isOpen,
  onClose,
  position,
  existingUsername,
  onSave
}) => {
  const [username, setUsername] = useState('');
  const [note, setNote] = useState('');
  const [color, setColor] = useState<NoteColor>('gray');
  const [vpipPfr, setVpipPfr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingPlayers, setExistingPlayers] = useState<PlayerNote[]>([]);
  const [usernameWarning, setUsernameWarning] = useState<string | null>(null);
  
  // Available colors for player notes
  const availableColors: NoteColor[] = [
    'red', 'yellow', 'green', 'blue', 'purple', 'orange', 'gray', 'black'
  ];
  
  // Check if username matches an existing player (case-insensitive)
  const checkExistingPlayer = (input: string) => {
    if (!input.trim()) {
      setUsernameWarning(null);
      return;
    }
    
    const existingPlayer = existingPlayers.find(
      player => player.username.toLowerCase() === input.toLowerCase()
    );
    
    if (existingPlayer) {
      setUsernameWarning(`A player named "${existingPlayer.username}" already exists. Select them from the dropdown to edit their note.`);
    } else {
      setUsernameWarning(null);
    }
  };

  // Load existing players and note data if editing
  useEffect(() => {
    const loadData = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          let notes: PlayerNote[] = [];
          if (user) {
            // Fetch from Supabase if authenticated
            notes = await playerNotesService.getUserNotes(user.id);
          } else {
            // Fetch from localStorage if not authenticated
            const localNotes = localStorage.getItem('playerNotes');
            if (localNotes) {
              notes = JSON.parse(localNotes);
            }
          }
          
          setExistingPlayers(Array.isArray(notes) ? notes : []);
          
          // Load existing note if editing
          if (existingUsername) {
            const existingNote = notes.find(n => n.username === existingUsername);
            if (existingNote) {
              setUsername(existingNote.username);
              setNote(existingNote.note || '');
              setVpipPfr(existingNote.vpip_pfr || '');
              setColor(existingNote.color as NoteColor);
            }
          } else {
            // Reset for a new note
            setUsername('');
            setNote('');
            setVpipPfr('');
            setColor('gray');
          }
        } catch (error) {
          console.error('Error loading player data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
  }, [isOpen, existingUsername]);
  
  const handleSelectExistingPlayer = (player: PlayerNote) => {
    setUsername(player.username);
    setNote(player.note || '');
    setVpipPfr(player.vpip_pfr || '');
    setColor(player.color as NoteColor);
    setUsernameWarning(null);
  };
  
  const handleSave = async () => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }
    
    // Normalize username to lowercase for comparison
    const normalizedUsername = username.trim().toLowerCase();
    
    // Check if we're trying to create a new note for an existing player
    const existingPlayer = existingPlayers.find(
      player => player.username.toLowerCase() === normalizedUsername
    );
    
    if (existingPlayer && existingPlayer.username.toLowerCase() !== normalizedUsername) {
      alert(`A player named "${existingPlayer.username}" already exists. Please select them from the dropdown to edit their note.`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const playerNote: PlayerNote = {
        username: username.trim(), // Keep original case for display
        note: note.trim(),
        vpip_pfr: vpipPfr.trim(),
        color: color,
        updated_at: new Date().toISOString()
      };
      
      // Get current position mappings
      let positionMappings: Record<string, string> = {};
      try {
        const storedMappings = localStorage.getItem('positionPlayerMapping');
        if (storedMappings) {
          positionMappings = JSON.parse(storedMappings);
        }
      } catch (error) {
        console.error('Error parsing position mappings:', error);
      }
      
      // Update position mapping if we have a position
      if (position) {
        positionMappings[position] = username.trim();
        localStorage.setItem('positionPlayerMapping', JSON.stringify(positionMappings));
      }
      
      try {
        const success = await playerNotesService.saveNote(playerNote);
        if (success) {
          onSave();
          onClose();
        } else {
          throw new Error('Failed to save note - service returned false');
        }
      } catch (error) {
        console.error('Error saving player note:', error);
        alert('Failed to save player note. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error saving player note:', error);
      alert('Failed to save player note. Please try again.');
    }
  };
  
  const handleDelete = async () => {
    if (!username || !confirm('Are you sure you want to delete this player note?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await playerNotesService.deleteNote(username);
      if (success) {
        // Also remove from position mappings
        try {
          const storedMappings = localStorage.getItem('positionPlayerMapping');
          if (storedMappings) {
            const positionMappings = JSON.parse(storedMappings);
            
            // Find and remove all mappings to this username
            Object.keys(positionMappings).forEach(pos => {
              if (positionMappings[pos] === username) {
                delete positionMappings[pos];
              }
            });
            
            localStorage.setItem('positionPlayerMapping', JSON.stringify(positionMappings));
          }
        } catch (error) {
          console.error('Error updating position mappings:', error);
        }
        
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error deleting player note:', error);
      alert('Failed to delete player note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearSeat = async () => {
    if (!position) return;
    
    try {
      // Get current position mappings
      let positionMappings: Record<string, string> = {};
      try {
        const storedMappings = localStorage.getItem('positionPlayerMapping');
        if (storedMappings) {
          positionMappings = JSON.parse(storedMappings);
        }
      } catch (error) {
        console.error('Error parsing position mappings:', error);
      }
      
      // Remove the mapping for this position
      delete positionMappings[position];
      localStorage.setItem('positionPlayerMapping', JSON.stringify(positionMappings));
      
      // Refresh the UI
      onSave();
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error clearing seat:', error);
      alert('Failed to clear seat. Please try again.');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div 
        className="w-full max-w-md glass-container rounded-lg p-6 max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-zinc-100">
          {existingUsername ? 'Edit Player Note' : 'Add Player Note'}
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <>
            {/* Existing players dropdown */}
            {existingPlayers.length > 0 && (
              <div className="mb-4">
                <label className="block text-zinc-300 font-bold mb-2">
                  Select Existing Player
                </label>
                <select
                  onChange={(e) => {
                    const selectedPlayer = existingPlayers.find(
                      p => p.username === e.target.value
                    );
                    if (selectedPlayer) {
                      handleSelectExistingPlayer(selectedPlayer);
                    }
                  }}
                  value=""
                  className="w-full px-3 py-2 border border-zinc-600 rounded bg-zinc-800 text-zinc-300"
                >
                  <option value="">-- Select a player --</option>
                  {existingPlayers
                    .sort((a, b) => a.username.localeCompare(b.username))
                    .map((player) => (
                    <option key={player.username} value={player.username}>
                      {player.username} {player.vpip_pfr ? `(${player.vpip_pfr})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-zinc-300 font-bold mb-2">
                Player Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  checkExistingPlayer(e.target.value);
                }}
                className={`w-full px-3 py-2 border border-zinc-600 rounded bg-zinc-800 text-zinc-300 ${
                  usernameWarning ? 'border-yellow-500' : ''
                }`}
                placeholder="Enter player name"
              />
              {usernameWarning && (
                <p className="text-yellow-500 text-sm mt-1">
                  {usernameWarning}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-zinc-300 font-bold mb-2">
                VPIP/PFR
              </label>
              <input
                type="text"
                value={vpipPfr}
                onChange={(e) => setVpipPfr(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-600 rounded bg-zinc-800 text-zinc-300"
                placeholder="e.g., 24/18"
              />
              <p className="text-sm text-zinc-400 mt-1">
                Voluntary Put In Pot / Preflop Raise (e.g., 24/18)
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-zinc-300 font-bold mb-2">
                Player Color
              </label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((colorOption) => (
                  <button
                    key={colorOption}
                    onClick={() => setColor(colorOption)}
                    className={`
                      w-8 h-8 rounded-full shadow-md transition-all
                      hover:scale-110 duration-100
                      ${colorOption === color ? 'ring-2 ring-white' : ''}
                    `}
                    style={{ backgroundColor: colorOption }}
                    aria-label={`Select ${colorOption} color`}
                  />
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-zinc-300 font-bold mb-2">
                Notes
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-600 rounded bg-zinc-800 text-zinc-300 min-h-[100px]"
                placeholder="Enter notes about this player..."
              />
            </div>
            
            <div className="flex justify-between mt-6">
              {username && existingPlayers.some(p => p.username === username) && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-md button-danger"
                  >
                    Delete
                  </button>
                  {position && (
                    <button
                      onClick={handleClearSeat}
                      className="px-4 py-2 rounded-md button-secondary"
                    >
                      Clear Seat
                    </button>
                  )}
                </div>
              )}
              
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-md button-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-md button-primary"
                >
                  Save
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlayerNoteModal; 