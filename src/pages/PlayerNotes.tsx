import React, { useState, useCallback } from 'react';
import { TableSize, PositionName } from '../types';
import PlayerNotesTable from '../components/PlayerNotesTable';
import PlayerNoteModal from '../components/PlayerNoteModal';
import BulkPlayerEntryModal from '../components/BulkPlayerEntryModal';
import { supabase } from '../lib/supabase';

interface PlayerNotesProps {
  onLoginPrompt: () => void;
}

const PlayerNotes: React.FC<PlayerNotesProps> = ({ onLoginPrompt }) => {
  const [tableSize, setTableSize] = useState<TableSize>(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<PositionName | null>(null);
  const [existingUsername, setExistingUsername] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Handle table size toggle
  const handleTableSizeChange = () => {
    setTableSize(tableSize === 6 ? 8 : 6);
  };
  
  // Open the note modal for a position
  const handleOpenNoteModal = useCallback((position: PositionName, username?: string) => {
    setSelectedPosition(position);
    setExistingUsername(username);
    setModalOpen(true);
  }, []);
  
  // Open bulk player entry modal
  const handleOpenBulkModal = () => {
    setBulkModalOpen(true);
  };
  
  // Close the modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPosition(null);
    setExistingUsername(undefined);
  };
  
  // Close bulk modal
  const handleCloseBulkModal = () => {
    setBulkModalOpen(false);
  };
  
  // Handle note save completion
  const handleNoteSaved = () => {
    // Increment refresh key to trigger PlayerNotesTable to fetch notes again
    setRefreshKey(prev => prev + 1);
    
    // Notify user that note was saved
    showMessage('Player note saved!');
  };

  // Handle player removed from seat
  const handlePlayerRemoved = () => {
    // Increment refresh key to trigger PlayerNotesTable to fetch notes again
    setRefreshKey(prev => prev + 1);
    
    // Notify user that player was removed
    showMessage('Player removed from seat!');
  };
  
  // Handle bulk players saved
  const handleBulkPlayersSaved = () => {
    // Increment refresh key to trigger PlayerNotesTable to fetch notes again
    setRefreshKey(prev => prev + 1);
    
    // Notify user that players were saved
    showMessage('Players added to table!');
  };

  const handleClearAllSeats = () => {
    // Clear all position-player mappings
    localStorage.removeItem('positionPlayerMapping');
    setRefreshKey(prev => prev + 1);
    showMessage('All seats cleared!');
  };
  
  const showMessage = (text: string) => {
    // Create and show a temporary message element
    const messageElement = document.createElement('div');
    messageElement.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg';
    messageElement.textContent = text;
    document.body.appendChild(messageElement);
    
    // Remove message after 2 seconds
    setTimeout(() => {
      document.body.removeChild(messageElement);
    }, 2000);
  };

  return (
    <div className="container mx-auto px-1 py-4">
      <h1 className="text-3xl font-bold text-zinc-100 mb-8">Player Notes</h1>
      
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <label className="block text-zinc-300 font-bold mb-2 sm:mb-0 sm:mr-2">
              Table Size
            </label>
            <div className="flex items-center">
              <button
                onClick={handleTableSizeChange}
                className={`px-4 py-2 rounded-md mr-2 ${tableSize === 6 ? 'button-accent' : 'button-secondary'}`}
              >
                6-Max
              </button>
              <button
                onClick={handleTableSizeChange}
                className={`px-4 py-2 rounded-md ${tableSize === 8 ? 'button-accent' : 'button-secondary'}`}
              >
                8-Max
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-zinc-300 font-bold mb-2 sm:mb-0 sm:mr-2">
              Table Controls
            </label>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenBulkModal}
                className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white"
                title="Add multiple players at once"
              >
                Add Multiple Players
              </button>
              <button
                onClick={handleClearAllSeats}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
                title="Clear all seats while preserving player notes"
              >
                Clear All Seats
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <p className="text-zinc-300">
          Click on a position to add or edit player notes. Players are saved by username and can be placed in any position at the table.
        </p>
        {!supabase.auth.getUser() && (
          <button
            onClick={onLoginPrompt}
            className="mt-2 text-sm text-teal-400 hover:text-teal-300"
          >
            Login to save your notes in the cloud
          </button>
        )}
      </div>
      
      <PlayerNotesTable 
        tableSize={tableSize} 
        onOpenNoteModal={handleOpenNoteModal}
        refreshKey={refreshKey}
        onPlayerRemoved={handlePlayerRemoved}
      />
      
      {modalOpen && selectedPosition && (
        <PlayerNoteModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          position={selectedPosition}
          existingUsername={existingUsername}
          onSave={handleNoteSaved}
        />
      )}
      
      <BulkPlayerEntryModal
        isOpen={bulkModalOpen}
        onClose={handleCloseBulkModal}
        tableSize={tableSize}
        onSave={handleBulkPlayersSaved}
      />
    </div>
  );
};

export default PlayerNotes; 