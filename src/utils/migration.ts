import { PlayerNote } from '../types';
import { playerNotesService } from "../services/playerNotesService";
import { supabase } from "../lib/supabase";

export const migrateLocalNotesToSupabase = async () => {
  try {
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User not authenticated:', authError);
      return;
    }
    

    // Check local storage for notes
    const localNotes = localStorage.getItem('playerNotes');
    if (!localNotes) {

      return;
    }

    const notes = JSON.parse(localNotes) as PlayerNote[];
    if (!notes.length) {
  
      return;
    }



    // Ask user if they want to import their notes
    const shouldImport = window.confirm(
      `You have ${notes.length} player note(s) saved locally. Would you like to import them to your account?`
    );

    if (shouldImport) {
      let successCount = 0;

      // Upload each note to Supabase
      for (const note of notes) {
        try {
          
          await playerNotesService.saveNote({
            username: note.username,
            note: note.note,
            vpip_pfr: note.vpip_pfr,
            color: note.color
          });
          successCount++;
          
        } catch (error) {
          console.error(`Error saving note for ${note.username}:`, error);
        }
      }

      // Verify notes were saved
      const { data: savedNotes, error: fetchError } = await supabase
        .from('player_notes')
        .select('id, username, note, vpip_pfr, color, created_at, updated_at')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error verifying saved notes:', fetchError);
        alert('Failed to verify imported notes. Your local notes will be preserved.');
        return;
      }

      const verifiedCount = savedNotes?.length || 0;

      // Only clear local storage if we successfully imported all notes
      if (verifiedCount >= notes.length) {

        localStorage.removeItem('playerNotes');
        alert(`Successfully imported ${successCount} notes to your account.`);
      } else {

        alert(`Warning: Only ${verifiedCount} out of ${notes.length} notes were verified in the database. Your local notes will be preserved.`);
      }
    } else {
      console.log('User declined to import notes');
    }
  } catch (error) {
    console.error('Error in migration process:', error);
    alert('Failed to import notes. Your local notes will be preserved.');
  }
}; 