import React, { useState, useEffect, useRef } from 'react';
import { TableSize, PositionName, PlayerNote, NoteColor } from '../types';
import { getPositionsForTableSize } from '../utils/position';
import { playerNotesService } from '../services/playerNotesService';
import { supabase } from '../lib/supabase';

interface BulkPlayerEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableSize: TableSize;
  onSave: () => void;
}

interface PlayerEntryData {
  position: PositionName;
  username: string;
  vpip_pfr: string;
}

const BulkPlayerEntryModal: React.FC<BulkPlayerEntryModalProps> = ({
  isOpen,
  onClose,
  tableSize,
  onSave
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [playerEntries, setPlayerEntries] = useState<PlayerEntryData[]>([]);
  const [existingPlayers, setExistingPlayers] = useState<PlayerNote[]>([]);
  // Added state to track which positions have active autocomplete suggestions
  const [activeAutocomplete, setActiveAutocomplete] = useState<number[]>([]);
  // Find first input field ref for autofocus - moved to the top
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  // Load positions and existing player data
  useEffect(() => {
    if (isOpen) {
      // Initialize player entries based on table positions
      const tablePositions = getPositionsForTableSize(tableSize);
      
      // Sort positions to start with UTG (for 8-max) or LJ (for 6-max) at the top
      // This follows the clockwise order around the table with UTG at 12 o'clock
      let sortedPositions = [...tablePositions];
      
      // For 8-max, the order should be: UTG, UTG1, LJ, HJ, CO, BTN, SB, BB
      // For 6-max, the order should be: LJ, HJ, CO, BTN, SB, BB
      
      // Sort by orderIndex to ensure correct clockwise order
      sortedPositions.sort((a, b) => a.orderIndex - b.orderIndex);
      
      // Initialize with empty entries for each position
      const initialEntries = sortedPositions.map(position => ({
        position: position.name,
        username: '',
        vpip_pfr: ''
      }));
      
      setPlayerEntries(initialEntries);
      // Reset autocomplete state when modal opens
      setActiveAutocomplete([]);
      
      // Load existing players for autocomplete
      const loadExistingPlayers = async () => {
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
        } catch (error) {
          console.error('Error loading existing players:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadExistingPlayers();
    }
  }, [isOpen, tableSize]);
  
  // Focus first input when modal opens - moved before conditional return
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // Handle input change for a position
  const handleInputChange = (index: number, field: 'username' | 'vpip_pfr', value: string) => {
    const updatedEntries = [...playerEntries];
    updatedEntries[index] = {
      ...updatedEntries[index],
      [field]: value
    };
    setPlayerEntries(updatedEntries);
    
    // Show autocomplete suggestions when typing in username field
    if (field === 'username' && value.trim() !== '') {
      if (!activeAutocomplete.includes(index)) {
        setActiveAutocomplete([...activeAutocomplete, index]);
      }
    } else if (field === 'username' && value.trim() === '') {
      // Hide autocomplete when input is cleared
      setActiveAutocomplete(activeAutocomplete.filter(i => i !== index));
    }
  };
  
  // Get position display name with description
  const getPositionDisplayName = (position: PositionName): string => {
    const tablePositions = getPositionsForTableSize(tableSize);
    const positionInfo = tablePositions.find(p => p.name === position);
    return positionInfo ? `${positionInfo.displayName} (${positionInfo.description})` : position;
  };
  
  // Handle save all players
  const handleSaveAll = async () => {
    // Filter out empty entries
    const validEntries = playerEntries.filter(entry => entry.username.trim() !== '');
    
    if (validEntries.length === 0) {
      alert('Please enter at least one player name');
      return;
    }
    
    setIsLoading(true);
    
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
      
      // Process each valid entry
      for (const entry of validEntries) {
        // Check if this player already exists
        const existingPlayer = existingPlayers.find(
          player => player.username.toLowerCase() === entry.username.toLowerCase()
        );
        
        // Create or update player note
        const playerNote: PlayerNote = {
          username: entry.username.trim(),
          vpip_pfr: entry.vpip_pfr.trim(),
          note: existingPlayer?.note || '',
          color: existingPlayer?.color || 'gray',
          updated_at: new Date().toISOString()
        };
        
        // Save the player note
        await playerNotesService.saveNote(playerNote);
        
        // Update position mapping
        positionMappings[entry.position] = entry.username.trim();
      }
      
      // Save updated position mappings
      localStorage.setItem('positionPlayerMapping', JSON.stringify(positionMappings));
      
      // Notify parent and close modal
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving bulk player entries:', error);
      alert('Failed to save player entries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Find existing players that match the input
  const findMatchingPlayers = (input: string) => {
    if (!input.trim()) return [];
    
    const normalizedInput = input.toLowerCase();
    return existingPlayers
      .filter(player => player.username.toLowerCase().includes(normalizedInput))
      .slice(0, 5); // Limit to 5 suggestions
  };
  
  // Handle selection of an existing player
  const handleSelectExistingPlayer = (index: number, player: PlayerNote) => {
    const updatedEntries = [...playerEntries];
    updatedEntries[index] = {
      ...updatedEntries[index],
      username: player.username,
      vpip_pfr: player.vpip_pfr || ''
    };
    setPlayerEntries(updatedEntries);
    
    // Hide autocomplete suggestions for this position after selection
    setActiveAutocomplete(activeAutocomplete.filter(i => i !== index));
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (index: number, field: 'username' | 'vpip_pfr', e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If at username field, move to VPIP/PFR field
      if (field === 'username') {
        const vpipInput = document.getElementById(`vpip-${index}`);
        if (vpipInput) {
          vpipInput.focus();
        }
      } 
      // If at VPIP/PFR field, move to next player's username field
      else if (field === 'vpip_pfr') {
        const nextIndex = (index + 1) % playerEntries.length;
        const nextUsernameInput = document.getElementById(`username-${nextIndex}`);
        if (nextUsernameInput) {
          nextUsernameInput.focus();
        }
      }
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div 
        className="w-full max-w-3xl bg-zinc-900 text-white p-5 rounded-lg shadow-lg border border-zinc-700 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-3">
          <h2 className="text-xl font-bold">Bulk Player Entry</h2>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-zinc-300 mb-2">
            Quickly add players to multiple positions at once. Enter player names and VPIP/PFR values for each position.
          </p>
          <p className="text-zinc-400 text-sm">
            Leave fields blank for positions you don't want to fill. Press Enter to move between fields.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {playerEntries.map((entry, index) => {
            const matchingPlayers = findMatchingPlayers(entry.username);
            const positionInfo = getPositionsForTableSize(tableSize).find(p => p.name === entry.position);
            const positionDisplayText = positionInfo ? 
              `${entry.position} (${positionInfo.description})` : 
              entry.position;
            
            return (
              <div key={entry.position} className="p-3 bg-zinc-800 rounded-md">
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <input
                      id={`username-${index}`}
                      type="text"
                      value={entry.username}
                      onChange={e => handleInputChange(index, 'username', e.target.value)}
                      onKeyDown={e => handleKeyDown(index, 'username', e)}
                      placeholder={positionDisplayText}
                      className="w-full px-3 py-2 bg-zinc-700 rounded border border-zinc-600 focus:border-teal-500 focus:ring focus:ring-teal-500/30 focus:outline-none"
                      ref={index === 0 ? firstInputRef : null}
                      // Add onBlur to hide suggestions when the input loses focus
                      onBlur={() => setTimeout(() => {
                        setActiveAutocomplete(activeAutocomplete.filter(i => i !== index));
                      }, 200)} // Small timeout to allow click on suggestion to register first
                    />
                    
                    {/* Show dropdown of matching players if any and this position is in activeAutocomplete */}
                    {entry.username.trim() !== '' && matchingPlayers.length > 0 && activeAutocomplete.includes(index) && (
                      <div className="absolute z-10 w-full mt-1 bg-zinc-700 border border-zinc-600 rounded shadow-lg max-h-40 overflow-y-auto">
                        {matchingPlayers.map((player, idx) => (
                          <button
                            key={idx}
                            className="block w-full px-3 py-2 text-left hover:bg-zinc-600 text-sm"
                            onClick={() => handleSelectExistingPlayer(index, player)}
                          >
                            <div>{player.username}</div>
                            {player.vpip_pfr && (
                              <div className="text-xs text-zinc-400">VPIP/PFR: {player.vpip_pfr}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="w-24">
                    <input
                      id={`vpip-${index}`}
                      type="text"
                      value={entry.vpip_pfr}
                      onChange={e => handleInputChange(index, 'vpip_pfr', e.target.value)}
                      onKeyDown={e => handleKeyDown(index, 'vpip_pfr', e)}
                      placeholder="VPIP/PFR"
                      className="w-full px-3 py-2 bg-zinc-700 rounded border border-zinc-600 focus:border-teal-500 focus:ring focus:ring-teal-500/30 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-end mt-4 border-t border-zinc-700 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md button-secondary mr-2"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-md button-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save All Players'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkPlayerEntryModal; 