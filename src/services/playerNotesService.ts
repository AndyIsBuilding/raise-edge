import { supabase } from '../lib/supabase';
import { PlayerNote } from '../types';

class PlayerNotesService {
  async getUserNotes(userId: string): Promise<PlayerNote[]> {
    try {
      const { data, error } = await supabase
        .from('player_notes')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching player notes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserNotes:', error);
      return [];
    }
  }

  async saveNote(note: PlayerNote): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // First check if the note exists
        const { data: existingNote, error: fetchError } = await supabase
          .from('player_notes')
          .select('*')
          .eq('username', note.username)
          .eq('user_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error checking for existing note:', fetchError);
          return false;
        }

        let result;
        if (existingNote) {
          // Update existing note
          const { data, error: updateError } = await supabase
            .from('player_notes')
            .update({
              ...note,
              user_id: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('username', note.username)
            .eq('user_id', user.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating note:', updateError);
            return false;
          }
          result = data;
        } else {
          // Insert new note
          const { data, error: insertError } = await supabase
            .from('player_notes')
            .insert({
              ...note,
              user_id: user.id,
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error inserting note:', insertError);
            return false;
          }
          result = data;
        }

        if (!result) {
          console.error('No data returned from operation');
          return false;
        }

        return true;
      } else {
        // Save to localStorage if not authenticated
        console.log('User not authenticated, saving to localStorage');
        const existingNotes = localStorage.getItem('playerNotes');
        let notes: PlayerNote[] = existingNotes ? JSON.parse(existingNotes) : [];
        
        // Remove existing note for this username if it exists (case-insensitive)
        notes = notes.filter(n => n.username.toLowerCase() !== note.username.toLowerCase());
        
        // Add the new note with updated timestamp
        const newNote = {
          ...note,
          updated_at: new Date().toISOString()
        };
        
        notes.push(newNote);
        localStorage.setItem('playerNotes', JSON.stringify(notes));
        return true;
      }
    } catch (error) {
      console.error('Error in saveNote:', error);
      return false;
    }
  }

  async deleteNote(username: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('player_notes')
          .delete()
          .eq('user_id', user.id)
          .eq('username', username);

        if (error) {
          console.error('Error deleting note:', error);
          return false;
        }
      } else {
        // Delete from localStorage if not authenticated
        const existingNotes = localStorage.getItem('playerNotes');
        if (existingNotes) {
          const notes: PlayerNote[] = JSON.parse(existingNotes);
          const filteredNotes = notes.filter(note => note.username !== username);
          localStorage.setItem('playerNotes', JSON.stringify(filteredNotes));
        }
      }

      return true;
    } catch (error) {
      console.error('Error in deleteNote:', error);
      return false;
    }
  }
}

export const playerNotesService = new PlayerNotesService(); 